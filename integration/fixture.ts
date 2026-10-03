import { testDatabase } from './database'
import { readFile } from 'node:fs/promises'
import { hashPassword } from 'better-auth/crypto'
import { createAuth } from '../server/auth'
import { createApi } from '../server/api'
import { createBlankCanvas } from '../src/data/factories'
export async function fixture(baseURL='http://localhost:8787'){
  const pg=await testDatabase()
  await pg.exec(await readFile(new URL('../server/db/migrations/0001.sql',import.meta.url),'utf8'))
  const db=pg.db
  for(const id of ['alice','bob']){
    await db.query('INSERT INTO auth_user(id,name,email,email_verified) VALUES($1,$1,$2,true)',[id,id+'@example.com'])
    await db.query("INSERT INTO auth_account(id,account_id,provider_id,user_id) VALUES($1,$1,'google',$2)",['google-'+id,id])
    await db.query("INSERT INTO auth_account(id,account_id,provider_id,user_id,password) VALUES($1,$2,'credential',$2,$3)",
      ['credential-'+id,id,await hashPassword('correct-password')])
  }
  const env={ASSETS:{fetch:async()=>new Response()},BETTER_AUTH_URL:baseURL,
    BETTER_AUTH_SECRET:'local-test-secret-that-is-at-least-32-characters',GOOGLE_CLIENT_ID:'test',GOOGLE_CLIENT_SECRET:'test',
    WRITES_ENABLED:'true',AUTH_REGISTRATION_ENABLED:'false'}
  const auth=createAuth(pg.orm,db,env)
  const app=createApi(db,auth,env)
  const request=async(path:string,body?:unknown,cookie?:string,key:string=crypto.randomUUID())=>{
    const headers:Record<string,string>={Origin:env.BETTER_AUTH_URL}
    if(cookie)headers.Cookie=cookie
    if(body!==undefined){headers['content-type']='application/json';headers['Idempotency-Key']=key}
    return app.request(env.BETTER_AUTH_URL+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)})
  }
  const login=async(id='alice')=>{
    const response=await request('/api/auth/sign-in/email',{email:id+'@example.com',password:'correct-password'})
    if(response.status!==200)throw new Error('Login failed: '+await response.text())
    return response.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ')
  }
  const canvas={...createBlankCanvas('Project'),id:'project'}
  const initial={previous:{canvases:[],revisions:{},orderRevision:1},next:[canvas],imports:[]}
  return {pg,db,app,auth,env,request,login,canvas,initial}
}

