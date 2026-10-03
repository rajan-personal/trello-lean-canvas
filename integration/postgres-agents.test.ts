import { afterAll,beforeAll,describe,expect,it } from 'vitest'
import { fixture } from './fixture'
import { digest } from '../server/db/receipt'
describe('scoped agent credentials',()=>{
  let f:Awaited<ReturnType<typeof fixture>>,token:string
  beforeAll(async()=>{
    f=await fixture()
    const cookie=await f.login()
    await f.request('/api/workspace',f.initial,cookie)
    await f.request('/api/projects/project/commands',{command:{type:'create-card',id:'task',title:'Task',columnId:'todo'},revision:1},cookie)
    const key=(await f.db.query('SELECT key FROM projects')).rows[0].key
    token=crypto.randomUUID()
    await f.db.query("INSERT INTO agent_credentials(id,project_key,name,token_hash,expires_at) VALUES('agent',$1,'Review agent',$2,now()+interval '1 hour')",[key,await digest(token)])
  },30000)
  afterAll(async()=>{await f?.pg.close()})
  const call=async(path:string,body?:unknown)=>f.app.request(f.env.BETTER_AUTH_URL+path,{
    method:body?'POST':'GET',headers:{authorization:'Bearer '+token,'content-type':'application/json','Idempotency-Key':crypto.randomUUID()},
    body:body?JSON.stringify(body):undefined})
  it('reads only its board and appends with server-controlled attribution',async()=>{
    expect((await call('/api/projects/project/board')).status).toBe(200)
    expect((await call('/api/projects/other/board')).status).toBe(404)
    expect((await call('/api/workspace')).status).toBe(403)
    const response=await call('/api/projects/project/commands',{command:{type:'add-comment',comment:{
      id:'agent-comment',cardId:'task',authorId:'fake',authorName:'Fake',text:'Reviewed',createdAt:'2000-01-01T00:00:00.000Z'}}})
    expect(response.status).toBe(200)
    const board=await(await call('/api/projects/project/board')).json()
    expect(board.data.comments[0]).toMatchObject({authorId:'agent',authorName:'Review agent',authorType:'agent'})
  })
  it('rejects ticket edits and revokes immediately',async()=>{
    expect((await call('/api/projects/project/commands',{command:{type:'delete-card',id:'task'},revision:2})).status).toBe(403)
    await f.db.query("UPDATE agent_credentials SET revoked_at=now() WHERE id='agent'")
    expect((await call('/api/projects/project/board')).status).toBe(401)
  })
})

