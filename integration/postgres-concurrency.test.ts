import { afterAll,beforeAll,describe,expect,it } from 'vitest'
import { fixture } from './fixture'
describe('atomic revisions and deletion',()=>{
  let f:Awaited<ReturnType<typeof fixture>>,cookie:string
  beforeAll(async()=>{f=await fixture();cookie=await f.login();await f.request('/api/workspace',f.initial,cookie)},30000)
  afterAll(async()=>{await f?.pg.close()})
  it('accepts one concurrent mutation per board revision',async()=>{
    const results=await Promise.all(['a','b'].map(id=>f.request('/api/projects/project/commands',
      {command:{type:'create-card',id,title:id,columnId:'todo'},revision:1},cookie)))
    expect(results.map(r=>r.status).sort()).toEqual([200,409])
    const board=await(await f.request('/api/projects/project/board',undefined,cookie)).json()
    expect(board.data.cards).toHaveLength(1)
    expect(board.data.activity.counts.reduce((a:number,b:number)=>a+b,0)).toBe(1)
  })
  it('does not overwrite existing boards on import and deletes the whole project',async()=>{
    const response=await f.request('/api/projects/project/import',{canvas:f.canvas,importId:'overwrite',
      board:{columns:[],cards:[],comments:[]}},cookie)
    expect(response.status).toBe(409)
    const previous=await(await f.request('/api/workspace',undefined,cookie)).json()
    expect((await f.request('/api/workspace',{previous,next:[],imports:[]},cookie)).status).toBe(200)
    expect((await f.db.query('SELECT * FROM tickets')).rows).toHaveLength(0)
    expect((await f.db.query('SELECT * FROM board_columns')).rows).toHaveLength(0)
  })
})

