import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import * as schema from './db/auth-schema'
import type { Database } from './db/connection'
import type { Env } from './env'
import { limiter } from './rate-limit'
export function createAuth(db: Parameters<typeof drizzleAdapter>[0], sql: Database, env: Env) {
  return betterAuth({
    appName:'Lean Canvas', baseURL:env.BETTER_AUTH_URL, secret:env.BETTER_AUTH_SECRET,
    database:drizzleAdapter(db,{provider:'pg',schema,transaction:true}),
    trustedOrigins:[env.BETTER_AUTH_URL!],
    emailAndPassword:{enabled:true,disableSignUp:true,minPasswordLength:8,maxPasswordLength:128},
    socialProviders:{ google:{clientId:env.GOOGLE_CLIENT_ID!,clientSecret:env.GOOGLE_CLIENT_SECRET!,
      disableSignUp:env.AUTH_REGISTRATION_ENABLED!=='true',prompt:'select_account'} },
    account:{accountLinking:{enabled:false}},
    session:{cookieCache:{enabled:false}},
    user:{additionalFields:{disabled:{type:'boolean',defaultValue:false,input:false}}},
    advanced:{ipAddress:{ipAddressHeaders:['cf-connecting-ip']}},
    rateLimit:{enabled:true,customStorage:limiter(sql)},
    // Credentials can only be changed through the Google-verified account route.
    disabledPaths:['/sign-up/email','/set-password','/change-password','/request-password-reset',
      '/reset-password','/unlink-account','/link-social','/change-email','/delete-user'],
    databaseHooks:{
      user:{ create:{before:async()=>env.AUTH_REGISTRATION_ENABLED==='true'} },
      session:{create:{before:async s=>{
        const u=(await sql.query('SELECT disabled FROM auth_user WHERE id=$1',[s.userId])).rows[0]
        return !!u && !u.disabled
      }}},
    },
  })
}
export type Auth = ReturnType<typeof createAuth>

