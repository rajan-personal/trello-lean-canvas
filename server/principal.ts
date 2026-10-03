import type { Auth } from './auth'
import type { Database } from './db/connection'
import type { Principal } from './env'
import { check } from './errors'
import { digest } from './db/receipt'
export async function authenticate(db: Database, auth: Auth, request: Request): Promise<Principal> {
  const bearer=request.headers.get('authorization')
  if(bearer) {
    check(bearer.startsWith('Bearer ') && bearer.length<1000,'Invalid credential.',401)
    const row=(await db.query(`SELECT a.id,a.name,a.project_key FROM agent_credentials a
      JOIN projects p ON p.key=a.project_key JOIN auth_user u ON u.id=p.owner_id
      WHERE a.token_hash=$1 AND a.expires_at>now() AND a.revoked_at IS NULL AND NOT u.disabled`,
    [await digest(bearer.slice(7))])).rows[0]
    check(row,'Invalid credential.',401)
    return {id:String(row.id),name:String(row.name),kind:'agent',projectKey:String(row.project_key)}
  }
  const value=await auth.api.getSession({headers:request.headers})
  check(value,'Please sign in again.',401)
  const u=(await db.query(`SELECT u.disabled,EXISTS(SELECT 1 FROM auth_account a
    WHERE a.user_id=u.id AND a.provider_id='google') AS google FROM auth_user u WHERE u.id=$1`,[value.user.id])).rows[0]
  check(u && !u.disabled && u.google,'Account unavailable.',403)
  const expected=request.headers.get('x-lean-user')
  check(!expected || expected===value.user.id,'Account changed. Reload before saving.',409)
  return {id:value.user.id,name:value.user.name,kind:'user'}
}

