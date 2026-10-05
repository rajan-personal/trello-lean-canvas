import { afterAll,beforeAll,describe,expect,it } from 'vitest'
import { fixture } from './fixture'
import { migrateSnapshot } from '../scripts/migration/import'
import { inspectSnapshot } from '../scripts/migration/snapshot'
import { createBlankCanvas } from '../src/data/factories'
import { boardDataSchema,defaultBoardColumns } from '../src/data/board'
import { readBoard } from '../server/db/board-read'
describe('verified source migration',()=>{
  let f:Awaited<ReturnType<typeof fixture>>
  beforeAll(async()=>{f=await fixture()},30000)
  afterAll(async()=>{await f?.pg.close()})
  const canvas={...createBlankCanvas('Migrated'),id:'legacy-text-id',notes:'Preserve\nall text',aboutTabs:[{id:'plan',title:'Plan',content:'# hello'}]}
  const path='users/migrated/workspaces/default',timestamp={seconds:1,nanoseconds:123456789}
  const boardPath=path+'/canvases/'+canvas.id+'/boards/default'
  const child={schemaVersion:1,canvasId:canvas.id,updatedAt:timestamp}
  const snapshot={version:1,projectId:'test-project',readTime:'2026-10-04T00:00:00Z',
    users:[{id:'migrated',email:'m@example.com',name:'Migrated',image:null,emailVerified:true,disabled:false,googleAccountId:'google-subject'}],
    documents:[{path,data:{schemaVersion:2,canvasOrder:[canvas.id],orderRevision:5,updatedAt:timestamp}},
      {path:path+'/canvases/'+canvas.id,data:{...Object.fromEntries(Object.entries(canvas).filter(([k])=>k!=='id')),schemaVersion:1,revision:3,updatedAt:timestamp}},
      {path:boardPath,data:{...child,revision:7,columns:defaultBoardColumns,status:'active',importId:'',deletingCardId:''}},
      {path:boardPath+'/cards/root',data:{...child,columnId:'todo',title:'Root',description:'',rank:'h'}},
      {path:boardPath+'/cards/nested',data:{...child,parentTicketId:'root',columnId:'done',title:'Nested',description:'Text',rank:'h',storyPoints:5}},
      {path:boardPath+'/childCounts/root',data:{...child,count:1}},
      {path:boardPath+'/comments/historical',data:{...child,cardId:'nested',authorId:'migrated',authorName:'Historical name',text:'Preserved',createdAt:'2026-10-01T01:02:03.123456789Z'}}]}
  it('audits without writes and preserves IDs and content on idempotent apply',async()=>{
    expect((await migrateSnapshot(f.db,snapshot)).applied).toBe(false)
    expect((await f.db.query("SELECT * FROM auth_user WHERE id='migrated'")).rows).toHaveLength(0)
    expect((await migrateSnapshot(f.db,snapshot,true)).projects).toBe(1)
    await migrateSnapshot(f.db,snapshot,true)
    const row=(await f.db.query("SELECT * FROM projects WHERE owner_id='migrated'")).rows[0]
    expect(row.payload).toEqual(canvas)
    expect(row.revision).toBe(3)
    const board=await readBoard(f.db,String(row.key))
    expect(board.revision).toBe(7)
    expect(board.data.cards.find(c=>c.id==='nested')).toMatchObject({parentTicketId:'root',storyPoints:5})
    expect(boardDataSchema.parse(board.data).comments[0]).toMatchObject({authorName:'Historical name',createdAt:'2026-10-01T01:02:03.123456789Z'})
    expect((await f.db.query("SELECT account_id FROM auth_account WHERE user_id='migrated'")).rows[0].account_id).toBe('google-subject')
  })
  it('refuses changed source, post-import edits, and unknown collections',async()=>{
    await expect(migrateSnapshot(f.db,{...snapshot,users:[{...snapshot.users[0],name:'Changed'}]},true)).rejects.toThrow('source changed')
    await f.db.query("UPDATE projects SET revision=revision+1 WHERE owner_id='migrated'")
    await expect(migrateSnapshot(f.db,snapshot,true)).rejects.toThrow('Revision verification')
    expect(()=>inspectSnapshot({...snapshot,documents:[...snapshot.documents,{path:'unknown/data',data:{}}]})).toThrow('Unmapped')
  })
})
