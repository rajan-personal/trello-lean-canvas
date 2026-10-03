import { afterAll,beforeAll,describe,expect,it } from 'vitest'
import { fixture } from './fixture'
import type { BoardSnapshot,WorkspaceValue } from '../src/data/persistence-types'
describe('PostgreSQL data invariants',()=>{
  let f:Awaited<ReturnType<typeof fixture>>,cookie:string
  beforeAll(async()=>{f=await fixture();cookie=await f.login()},30000)
  afterAll(async()=>{await f?.pg.close()})
  it('creates atomically, retries without duplication, and rejects payload reuse',async()=>{
    const response=await f.request('/api/workspace',f.initial,cookie,'create')
    expect(response.status,await response.clone().text()).toBe(200)
    const first=await response.json()
    const retry=await f.request('/api/workspace',f.initial,cookie,'create')
    expect(await retry.json()).toEqual(first)
    expect((await f.request('/api/workspace',{...f.initial,next:[]},cookie,'create')).status).toBe(409)
    expect((await f.db.query('SELECT * FROM projects')).rows).toHaveLength(1)
  })
  it('isolates owners on read and write',async()=>{
    const bob=await f.login('bob')
    expect((await f.request('/api/projects/project/board',undefined,bob)).status).toBe(404)
    expect((await f.request('/api/projects/project/commands',{command:{type:'create-card',id:'bad',columnId:'todo',title:'Bad'},revision:1},bob)).status).toBe(404)
  })
  it('rejects stale canvas saves without overwriting the newer document',async()=>{
    const previous=await(await f.request('/api/workspace',undefined,cookie)).json() as WorkspaceValue
    const next=[{...f.canvas,notes:'New notes'}]
    expect((await f.request('/api/workspace',{previous,next,imports:[]},cookie)).status).toBe(200)
    expect((await f.request('/api/workspace',{previous,next:[{...f.canvas,notes:'Stale'}],imports:[]},cookie)).status).toBe(409)
    expect((await(await f.request('/api/workspace',undefined,cookie)).json()).canvases[0].notes).toBe('New notes')
  })
  it('preserves hierarchy, leaf-only deletion, stale revisions and exact activity',async()=>{
    const read=async()=>await(await f.request('/api/projects/project/board',undefined,cookie)).json() as BoardSnapshot
    const mutate=async(command:unknown,revision?:number)=>f.request('/api/projects/project/commands',{command,revision:revision??(await read()).revision},cookie)
    expect((await mutate({type:'create-card',id:'parent',columnId:'todo',title:'Parent'})).status).toBe(200)
    expect((await mutate({type:'create-card',id:'child',parentTicketId:'parent',columnId:'todo',title:'Child'})).status).toBe(200)
    expect((await mutate({type:'delete-card',id:'parent'})).status).not.toBe(200)
    expect((await mutate({type:'move-card',id:'child',columnId:'review',index:0},1)).status).toBe(409)
    const board=await read()
    expect(board.data.cards.find(c=>c.id==='child')?.parentTicketId).toBe('parent')
    expect(board.data.activity?.counts.reduce((a,b)=>a+b,0)).toBe(2)
  })
  it('derives comment identity and prevents duplicate comments after a lost acknowledgment',async()=>{
    const command={type:'add-comment',comment:{id:'comment',cardId:'child',authorId:'forged',authorName:'Forged',authorType:'agent',text:'Hello',createdAt:new Date().toISOString()}}
    for(let i=0;i<2;i++)expect((await f.request('/api/projects/project/commands',{command},cookie,'comment-retry')).status).toBe(200)
    const board=await(await f.request('/api/projects/project/board',undefined,cookie)).json()
    expect(board.data.comments).toHaveLength(1)
    expect(board.data.comments[0]).toMatchObject({authorId:'alice',authorType:'user',authorName:'alice'})
    expect(board.data.activity.counts.reduce((a:number,b:number)=>a+b,0)).toBe(2)
  })
})

