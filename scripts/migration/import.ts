import type { Database } from '../../server/db/connection'
import { digest } from '../../server/db/receipt'
import { writeBoard } from '../../server/db/board-write'
import { readBoard } from '../../server/db/board-read'
import { inspectSnapshot,type OwnerImport } from './snapshot'
import { check } from '../../server/errors'
export async function migrateSnapshot(db:Database,snapshot:unknown,apply=false){
  const owners=inspectSnapshot(snapshot)
  const report={users:owners.length,projects:owners.reduce((n,o)=>n+o.projects.length,0),
    tickets:owners.flatMap(o=>o.projects).reduce((n,p)=>n+p.board.cards.length,0),
    comments:owners.flatMap(o=>o.projects).reduce((n,p)=>n+p.board.comments.length,0),applied:false}
  if(!apply)return report
  for(const owner of owners)await importOwner(db,owner)
  return {...report,applied:true}
}
async function importOwner(db:Database,owner:OwnerImport){
  const checksum=await digest(owner),key='firebase-owner:'+owner.user.id
  await db.transaction(async sql=>{
    await sql.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[key])
    const previous=(await sql.query('SELECT checksum FROM migration_records WHERE source_key=$1',[key])).rows[0]
    if(previous){
      check(previous.checksum===checksum,'Migration source changed; reconcile before retrying.')
      await verifyOwner(sql,owner)
      return
    }
    const u=owner.user
    check(!(await sql.query('SELECT id FROM auth_user WHERE id=$1 OR lower(email)=$2',[u.id,u.email])).rows.length,
      'Destination user already exists; refusing to merge identities.')
    await sql.query(`INSERT INTO auth_user(id,name,email,email_verified,image,disabled) VALUES($1,$2,$3,$4,$5,$6)`,
      [u.id,u.name,u.email,u.emailVerified,u.image,u.disabled])
    await sql.query(`INSERT INTO auth_account(id,user_id,provider_id,account_id) VALUES($1,$2,'google',$3)`,
      [crypto.randomUUID(),u.id,u.googleAccountId])
    await sql.query('INSERT INTO workspaces(owner_id,order_revision) VALUES($1,$2)',[u.id,owner.orderRevision])
    for(const [position,p] of owner.projects.entries()){
      const row=(await sql.query(`INSERT INTO projects(owner_id,id,payload,position,revision,board_revision,source_metadata)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING key`,
      [u.id,p.canvas.id,JSON.stringify(p.canvas),position,p.revision,p.boardRevision,JSON.stringify(p.source)])).rows[0]
      await writeBoard(sql,String(row.key),p.board)
    }
    await verifyOwner(sql,owner)
    await sql.query('INSERT INTO migration_records(source_key,checksum) VALUES($1,$2)',[key,checksum])
  })
}
import type { Sql } from '../../server/db/connection'
async function verifyOwner(sql:Sql,owner:OwnerImport){
  const user=(await sql.query('SELECT * FROM auth_user WHERE id=$1',[owner.user.id])).rows[0]
  const account=(await sql.query("SELECT account_id FROM auth_account WHERE user_id=$1 AND provider_id='google'",[owner.user.id])).rows
  const workspace=(await sql.query('SELECT order_revision FROM workspaces WHERE owner_id=$1',[owner.user.id])).rows[0]
  check(user && user.email===owner.user.email && user.name===owner.user.name && user.image===owner.user.image &&
    user.email_verified===owner.user.emailVerified && user.disabled===owner.user.disabled &&
    account.length===1 && account[0].account_id===owner.user.googleAccountId,'Identity verification failed.')
  check(workspace?.order_revision===owner.orderRevision,'Workspace revision verification failed.')
  const rows=(await sql.query('SELECT * FROM projects WHERE owner_id=$1 ORDER BY position',[owner.user.id])).rows
  check(rows.length===owner.projects.length,'Project count changed; refusing migration retry.')
  const normalize=(board:OwnerImport['projects'][number]['board'])=>({
    ...board,cards:board.cards.map(c=>({...c,parentTicketId:c.parentTicketId??null,storyPoints:c.storyPoints??null})).sort((a,b)=>a.id.localeCompare(b.id)),
    comments:board.comments.map(c=>({...c,authorType:c.authorType??'user'})).sort((a,b)=>a.id.localeCompare(b.id)),
  })
  for(const [i,row] of rows.entries()){
    const source=owner.projects[i],board=await readBoard(sql,String(row.key))
    check(await digest(row.payload)===await digest(source.canvas),'Canvas verification failed.')
    check(board.revision===source.boardRevision && row.revision===source.revision,'Revision verification failed.')
    check(await digest(normalize(board.data as typeof source.board))===await digest(normalize(source.board)),'Board verification failed.')
  }
}
