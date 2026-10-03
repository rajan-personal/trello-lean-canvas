import { hashPassword } from 'better-auth/crypto'
import type { Database } from './db/connection'
import { check } from './errors'
import { z } from 'zod'
export async function savePassword(db: Database, uid: string, sessionId: string, input: unknown) {
  const { password,challenge }=z.strictObject({password:z.string().min(8).max(128),challenge:z.string().uuid()}).parse(input)
  const hash=await hashPassword(password)
  await db.transaction(async sql=>{
    const grant=(await sql.query(`DELETE FROM password_challenges
      WHERE id=$1 AND user_id=$2 AND session_id=$3 AND verified AND expires_at>now() RETURNING id`,
    [challenge,uid,sessionId])).rows[0]
    check(grant,'Google verification expired. Verify again.',403)
    await sql.query('SELECT id FROM auth_user WHERE id=$1 FOR UPDATE',[uid])
    const old=(await sql.query("SELECT id FROM auth_account WHERE user_id=$1 AND provider_id='credential'",[uid])).rows[0]
    if(old) await sql.query('UPDATE auth_account SET password=$2,updated_at=now() WHERE id=$1',[old.id,hash])
    else await sql.query(`INSERT INTO auth_account(id,account_id,provider_id,user_id,password)
      VALUES($1,$2,'credential',$2,$3)`,[crypto.randomUUID(),uid,hash])
    await sql.query('DELETE FROM auth_session WHERE user_id=$1 AND id<>$2',[uid,sessionId])
  })
  return {saved:true}
}

