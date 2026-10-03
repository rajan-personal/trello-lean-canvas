import { Hono } from 'hono'
import { z } from 'zod'
import type { Database } from '../db/connection'
import type { Auth } from '../auth'
import type { Principal,Env } from '../env'
import { authenticate } from '../principal'
import { check } from '../errors'
import { workspace } from '../services/workspace-read'
import { saveWorkspace } from '../services/workspace-write'
import { boardMutation } from '../services/board'
import { project } from '../db/project'
import { readBoard } from '../db/board-read'
import { workspaceInput,commandInput,recordId,pendingImportSchema,canvasInput } from '../validation'
import { boardDataSchema } from '../../src/data/board'
import { migrationCanvases } from '../../src/data/migration-ids'
import { importBoard } from '../services/import'
import { digest } from '../db/receipt'
export function dataRoutes(db:Database,auth:Auth,env:Env) {
  const app=new Hono<{Variables:{actor:Principal}}>()
  app.use('*',async(c,next)=>{c.set('actor',await authenticate(db,auth,c.req.raw));await next()})
  const human=(p:Principal)=>{check(p.kind==='user','Human session required.',403);return p.id}
  app.get('/workspace',async c=>c.json(await db.transaction(sql=>workspace(sql,human(c.get('actor'))))))
  app.post('/workspace',async c=>c.json(await saveWorkspace(db,human(c.get('actor')),
    workspaceInput.parse(await c.req.json()),c.req.header('Idempotency-Key')??'')))
  app.post('/workspace/prepare',async c=>{
    const uid=human(c.get('actor'))
    const input=z.strictObject({local:z.array(canvasInput),boards:z.record(z.string(),boardDataSchema)}).parse(await c.req.json())
    const local=await migrationCanvases(input.local)
    const imports=local.flatMap((canvas,i)=>input.boards[input.local[i].id]?
      [{canvas,board:input.boards[input.local[i].id],importId:'local-migration-'+canvas.id}]:[])
    const current=await db.transaction(sql=>workspace(sql,uid))
    if(!current.canvases.length && local.length && env.WRITES_ENABLED==='true') await saveWorkspace(db,uid,{previous:current,next:local,imports},
      'local-'+await digest({local,imports}))
    const actual=await db.transaction(sql=>workspace(sql,uid))
    return c.json({consumedLocal:local.length>0 && await digest(actual.canvases)===await digest(local)})
  })
  app.get('/changes',async c=>{
    const uid=human(c.get('actor'))
    const value=await db.transaction(async sql=>({
      workspace:(await sql.query('SELECT change_revision AS revision FROM workspaces WHERE owner_id=$1',[uid])).rows[0]?.revision??0,
      boards:(await sql.query('SELECT id,board_revision AS revision FROM projects WHERE owner_id=$1',[uid])).rows,
    }))
    return c.json(value)
  })
  app.get('/projects/:id/board',async c=>c.json(await db.transaction(async sql=>{
    const p=await project(sql,c.get('actor'),recordId.parse(c.req.param('id')))
    return readBoard(sql,p.key,c.req.query('summary')==='true')
  })))
  app.post('/projects/:id/commands',async c=>{
    const {command,revision}=commandInput.parse(await c.req.json())
    return c.json(await boardMutation(db,c.get('actor'),recordId.parse(c.req.param('id')),command,revision,c.req.header('Idempotency-Key')??''))
  })
  app.post('/projects/:id/import',async c=>{
    human(c.get('actor'))
    const input=pendingImportSchema.parse(await c.req.json())
    const result=await db.transaction(async sql=>{
      const actor=c.get('actor')
      await sql.query('SELECT owner_id FROM workspaces WHERE owner_id=$1 FOR UPDATE',[actor.id])
      const p=await project(sql,actor,recordId.parse(c.req.param('id')),true)
      await importBoard(sql,p.key,input.board,input.importId)
      return {saved:true}
    })
    return c.json(result)
  })
  return app
}

