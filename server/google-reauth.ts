import type { Database } from './db/connection'
import type { Env } from './env'
import { check } from './errors'
const redirectUri=(env:Env)=>env.BETTER_AUTH_URL+'/api/account/google/callback'
const base64=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')
export async function startGoogleVerification(db: Database, env: Env, uid:string, sessionId:string) {
  const id=crypto.randomUUID(),verifier=base64(crypto.getRandomValues(new Uint8Array(32)))
  await db.query('DELETE FROM password_challenges WHERE user_id=$1 OR expires_at<now()',[uid])
  await db.query(`INSERT INTO password_challenges(id,user_id,session_id,verifier,expires_at)
    VALUES($1,$2,$3,$4,now()+interval '5 minutes')`,[id,uid,sessionId,verifier])
  const challenge=base64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))))
  const url=new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.search=new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID!,redirect_uri:redirectUri(env),
    response_type:'code',scope:'openid email profile',prompt:'select_account',state:id,
    code_challenge:challenge,code_challenge_method:'S256'}).toString()
  return {url:url.toString(),challenge:id}
}
export async function finishGoogleVerification(db:Database,env:Env,uid:string,sessionId:string,url:URL) {
  check(!url.searchParams.has('error'),'Google verification was cancelled.',403)
  const state=url.searchParams.get('state'),code=url.searchParams.get('code')
  check(state && code,'Invalid Google callback.',400)
  const grant=(await db.query(`SELECT verifier FROM password_challenges
    WHERE id=$1 AND user_id=$2 AND session_id=$3 AND NOT verified AND expires_at>now()`,[state,uid,sessionId])).rows[0]
  check(grant,'Google verification expired.',403)
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',
    headers:{'content-type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({code,client_id:env.GOOGLE_CLIENT_ID!,client_secret:env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:redirectUri(env),grant_type:'authorization_code',code_verifier:String(grant.verifier)})})
  check(response.ok,'Google verification failed.',403)
  const token=await response.json() as {access_token?:string}
  check(token.access_token,'Google verification failed.',403)
  const profile=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{authorization:'Bearer '+token.access_token}})
  check(profile.ok,'Google verification failed.',403)
  const user=await profile.json() as {sub?:string;email_verified?:boolean}
  const linked=(await db.query("SELECT account_id FROM auth_account WHERE user_id=$1 AND provider_id='google'",[uid])).rows
  check(user.sub && user.email_verified && linked.some(a=>a.account_id===user.sub),'Choose the Google account already linked to this workspace.',403)
  await db.query('UPDATE password_challenges SET verified=true,verifier=$2 WHERE id=$1',[state,''])
  return state
}

