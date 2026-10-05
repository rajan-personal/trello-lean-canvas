import { drizzle } from 'drizzle-orm/node-postgres'
import { createAuth } from './auth'
import { createApi } from './api'
import { database,Pool } from './db/connection'
import type { Env } from './env'
export default {
  async fetch(request:Request,env:Env) {
    const path=new URL(request.url).pathname
    if(!path.startsWith('/api/')) return env.ASSETS.fetch(request)
    if(env.DATA_BACKEND!=='postgres') return Response.json({error:'PostgreSQL backend is not enabled.'},{status:503,headers:{'Cache-Control':'no-store'}})
    const connectionString=env.HYPERDRIVE?.connectionString??env.DATABASE_URL
    if(!connectionString || !env.BETTER_AUTH_URL || !env.BETTER_AUTH_SECRET || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET)
      return Response.json({error:'Backend configuration is incomplete.'},{status:503})
    const pool=new Pool({connectionString,max:2,connectionTimeoutMillis:10000})
    try {
      const db=database(pool),auth=createAuth(drizzle(pool),db,env)
      return await createApi(db,auth,env).fetch(request)
    } finally { await pool.end() }
  },
}

