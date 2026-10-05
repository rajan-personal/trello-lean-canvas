import { afterAll,beforeAll,beforeEach,describe,expect,it } from 'vitest'
import { fixture } from './fixture'
describe('PostgreSQL authentication and boundaries',()=>{
  let f:Awaited<ReturnType<typeof fixture>>
  beforeAll(async()=>{f=await fixture()},30000)
  beforeEach(async()=>{await f.db.query('DELETE FROM api_rate_limits')})
  afterAll(async()=>{await f?.pg.close()})
  it('signs in with Better Auth and exposes the preserved UID',async()=>{
    const cookie=await f.login()
    const response=await f.request('/api/account/me',undefined,cookie)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({uid:'alice',hasPassword:true})
  })
  it('rejects direct email signup and unverified password changes',async()=>{
    expect((await f.request('/api/auth/sign-up/email',{name:'New',email:'new@example.com',password:'correct-password'})).status).not.toBe(200)
    const cookie=await f.login()
    expect((await f.request('/api/auth/change-password',{currentPassword:'correct-password',newPassword:'other-password'},cookie)).status).not.toBe(200)
    const response=await f.request('/api/account/password',{password:'new-password',challenge:crypto.randomUUID()},cookie)
    expect(response.status).toBe(403)
  })
  it('rejects cross-origin writes and mismatched browser accounts',async()=>{
    const cookie=await f.login()
    const cross=await f.app.request(f.env.BETTER_AUTH_URL+'/api/workspace',{method:'POST',
      headers:{cookie,origin:'https://evil.example','content-type':'application/json'},body:JSON.stringify(f.initial)})
    expect(cross.status).toBe(403)
    const stale=await f.app.request(f.env.BETTER_AUTH_URL+'/api/workspace',{headers:{cookie,'x-lean-user':'bob'}})
    expect(stale.status).toBe(409)
  })
  it('rejects disabled accounts even with an existing session',async()=>{
    const cookie=await f.login('bob')
    await f.db.query("UPDATE auth_user SET disabled=true WHERE id='bob'")
    expect((await f.request('/api/account/me',undefined,cookie)).status).toBe(403)
    expect((await f.request('/api/auth/sign-in/email',{email:'bob@example.com',password:'correct-password'})).status).not.toBe(200)
  })
  it('consumes session-bound Google grants and revokes other sessions when setting a password',async()=>{
    const cookie=await f.login(),other=await f.login()
    const session=(await f.auth.api.getSession({headers:new Headers({cookie})}))!
    const challenge=crypto.randomUUID()
    await f.db.query(`INSERT INTO password_challenges(id,user_id,session_id,verifier,verified,expires_at)
      VALUES($1,'alice',$2,'',true,now()+interval '5 minutes')`,[challenge,session.session.id])
    const input={password:'new-secure-password',challenge}
    expect((await f.request('/api/account/password',input,other)).status).toBe(403)
    expect((await f.request('/api/account/password',input,cookie)).status).toBe(200)
    expect((await f.request('/api/account/password',input,cookie)).status).toBe(403)
    expect((await f.request('/api/account/me',undefined,other)).status).toBe(401)
    expect((await f.request('/api/account/me',undefined,cookie)).status).toBe(200)
    expect((await f.request('/api/auth/sign-in/email',{email:'alice@example.com',password:input.password})).status).toBe(200)
    expect((await f.request('/api/auth/sign-in/email',{email:'alice@example.com',password:'correct-password'})).status).not.toBe(200)
  })
})
