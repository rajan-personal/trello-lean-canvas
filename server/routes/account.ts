import { Hono } from 'hono'
import type { Database } from '../db/connection'
import type { Auth } from '../auth'
import type { Env } from '../env'
import { check } from '../errors'
import { authenticate } from '../principal'
import { startGoogleVerification,finishGoogleVerification } from '../google-reauth'
import { savePassword } from '../account-password'
import { limiter } from '../rate-limit'
export function accountRoutes(db:Database,auth:Auth,env:Env) {
  const app=new Hono()
  app.use('*',async(c,next)=>{
    const actor=await authenticate(db,auth,c.req.raw)
    check(actor.kind==='user','Human session required.',403)
    await next()
  })
  app.get('/me',async c=>{
    const s=(await auth.api.getSession({headers:c.req.raw.headers}))!
    const accounts=(await db.query("SELECT provider_id FROM auth_account WHERE user_id=$1",[s.user.id])).rows
    return c.json({uid:s.user.id,displayName:s.user.name,email:s.user.email,photoURL:s.user.image??null,
      hasPassword:accounts.some(a=>a.provider_id==='credential')})
  })
  app.post('/google/start',async c=>{
    check(env.WRITES_ENABLED==='true','Account changes are paused.',503)
    const s=(await auth.api.getSession({headers:c.req.raw.headers}))!
    check((await limiter(db).consume('reauth:'+s.user.id,{window:60,max:5})).allowed,'Try again shortly.',429)
    return c.json(await startGoogleVerification(db,env,s.user.id,s.session.id))
  })
  app.get('/google/callback',async c=>{
    const s=(await auth.api.getSession({headers:c.req.raw.headers}))!
    const challenge=await finishGoogleVerification(db,env,s.user.id,s.session.id,new URL(c.req.url))
    const nonce=crypto.randomUUID()
    c.header('Content-Security-Policy',`default-src 'none'; script-src 'nonce-${nonce}'`)
    return c.html(`<!doctype html><title>Verified</title><p>Verified. You can close this window.</p><script nonce="${nonce}">window.opener?.postMessage(${JSON.stringify({type:'lean-google-verified',challenge})},${JSON.stringify(env.BETTER_AUTH_URL)});window.close()</script>`)
  })
  app.post('/password',async c=>{
    check(env.WRITES_ENABLED==='true','Account changes are paused.',503)
    const s=(await auth.api.getSession({headers:c.req.raw.headers}))!
    check((await limiter(db).consume('password:'+s.user.id,{window:60,max:5})).allowed,'Try again shortly.',429)
    return c.json(await savePassword(db,s.user.id,s.session.id,await c.req.json()))
  })
  return app
}

