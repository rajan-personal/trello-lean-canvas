import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { ZodError } from 'zod'
import type { Database } from './db/connection'
import type { Auth } from './auth'
import type { Env } from './env'
import { ApiError,check } from './errors'
import { accountRoutes } from './routes/account'
import { dataRoutes } from './routes/data'
export function createApi(db:Database,auth:Auth,env:Env) {
  const app=new Hono()
  app.use('*',async(c,next)=>{
    c.header('Cache-Control','no-store')
    c.header('X-Content-Type-Options','nosniff')
    c.header('Referrer-Policy','no-referrer')
    if(!['GET','HEAD','OPTIONS'].includes(c.req.method) && !c.req.header('Authorization'))
      check(c.req.header('Origin')===env.BETTER_AUTH_URL,'Invalid request origin.',403)
    await next()
  })
  app.use('*',bodyLimit({maxSize:8*1024*1024,onError:c=>c.json({error:'Import is too large. Split it before uploading.'},413)}))
  app.get('/api/health',async c=>{
    const schema=await db.query('SELECT version FROM app_schema_version WHERE version=1')
    check(schema.rows.length===1,'Database schema is not ready.',503)
    return c.json({backend:'postgres',schemaVersion:1,writes:env.WRITES_ENABLED==='true'})
  })
  app.all('/api/auth/*',c=>auth.handler(c.req.raw))
  app.route('/api/account',accountRoutes(db,auth,env))
  app.use('/api/*',async(c,next)=>{
    if(c.req.method!=='GET' && c.req.path!=='/api/workspace/prepare') check(env.WRITES_ENABLED==='true','Maintenance in progress. Your draft has not been saved.',503)
    await next()
  })
  app.route('/api',dataRoutes(db,auth,env))
  app.notFound(c=>c.json({error:'Not found.'},404))
  app.onError((error,c)=>{
    if(error instanceof ApiError) return c.json({error:error.message},error.status)
    if(error instanceof ZodError) return c.json({error:'Invalid request data.'},400)
    if(['40001','40P01','23505'].includes(String((error as {code?:string}).code)))
      return c.json({error:'Data changed concurrently. Reload and retry.'},409)
    // Do not log SQL details, credentials, document bodies, or OAuth responses.
    console.error('API request failed', {method:c.req.method,path:new URL(c.req.url).pathname,error:error.name})
    return c.json({error:'Request failed. Please retry.'},500)
  })
  return app
}

