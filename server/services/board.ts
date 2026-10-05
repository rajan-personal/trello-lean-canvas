import type { Database, Sql } from '../db/connection'
import type { Principal } from '../env'
import { project } from '../db/project'
import { readBoard } from '../db/board-read'
import { writeBoard } from '../db/board-write'
import { applyBoardCommand, type BoardCommand } from '../../src/data/board-mutations'
import { recordTicketActivity } from '../../src/data/board-activity'
import { boardDataSchema } from '../../src/data/board'
import { ApiError, check } from '../errors'
import { receipt } from '../db/receipt'
export async function boardMutation(db: Database, actor: Principal, id: string, command: BoardCommand, revision: number | undefined, key: string) {
  return db.transaction(async sql => {
    const lookup = await project(sql,actor,id)
    await sql.query('SELECT owner_id FROM workspaces WHERE owner_id=$1 FOR UPDATE',[lookup.owner_id])
    const p = await project(sql,actor,id,true)
    return receipt(sql,p.owner_id,key,{ actor:actor.id,project: id,command,revision }, async () => {
      if (command.type === 'add-comment') return appendComment(sql,actor,p.key,command)
      check(actor.kind === 'user', 'This credential can only append comments.',403)
      check(revision === p.board_revision, 'Board changed in another session. Reload and retry.')
      const source = boardDataSchema.parse((await readBoard(sql,p.key)).data)
      let next
      try { next = recordTicketActivity(source,applyBoardCommand(source,command)) }
      catch(error) { throw new ApiError(409,(error as Error).message) }
      await writeBoard(sql,p.key,next)
      await sql.query('UPDATE projects SET board_revision=board_revision+1 WHERE key=$1',[p.key])
      await sql.query('UPDATE workspaces SET change_revision=change_revision+1 WHERE owner_id=$1',[p.owner_id])
      return { data: next,revision: p.board_revision+1 }
    })
  })
}
async function appendComment(sql: Sql, actor: Principal, key: string, command: Extract<BoardCommand,{type:'add-comment'}>) {
  const c = command.comment
  const ticket = (await sql.query('SELECT key FROM tickets WHERE project_key=$1 AND id=$2',[key,c.cardId])).rows[0]
  check(ticket,'Ticket not found.',404)
  const old = (await sql.query('SELECT * FROM comments WHERE project_key=$1 AND id=$2',[key,c.id])).rows[0]
  if (old) check(old.principal_id === actor.id && old.text === c.text && old.ticket_key === ticket.key,
    'Comment ID already used for different content.')
  else {
    await sql.query(`INSERT INTO comments(project_key,id,ticket_key,author_id,author_name,author_type,text,created_at,principal_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$4)`,[key,c.id,ticket.key,actor.id,actor.name,actor.kind,c.text,new Date().toISOString()])
    await sql.query('UPDATE projects SET board_revision=board_revision+1 WHERE key=$1',[key])
    await sql.query('UPDATE workspaces SET change_revision=change_revision+1 WHERE owner_id=(SELECT owner_id FROM projects WHERE key=$1)',[key])
  }
  return { id:c.id }
}

