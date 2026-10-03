import { useEffect,useState,type PropsWithChildren } from 'react'
import { AuthContext,type AppUser } from './auth-context'
import { authClient } from './better-auth-client'
import { api,clearHttpRequests } from '../data/http-client'
import { googlePassword } from './google-password'
export function PostgresAuthProvider({children}:PropsWithChildren){
  const session=authClient.useSession()
  const [user,setUser]=useState<AppUser|null>(null)
  const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null)
  const [profileLoading,setProfileLoading]=useState(true)
  const uid=session.data?.user.id
  useEffect(()=>{
    let active=true
    const load=async()=>{
      setProfileLoading(true)
      setUser(null);clearHttpRequests()
      try{if(uid){const value=await api<AppUser>(uid,'/account/me');if(active)setUser(value)}}
      catch(cause){if(active)setError((cause as Error).message)}
      finally{if(active)setProfileLoading(false)}
    }
    void load()
    return()=>{active=false}
  },[uid])
  const run=async(work:()=>Promise<unknown>)=>{
    setBusy(true);setError(null)
    try{await work()}catch(cause){setError((cause as Error).message)}finally{setBusy(false)}
  }
  return <AuthContext.Provider value={{
    user,loading:session.isPending||profileLoading,busy,error,
    signIn:()=>run(async()=>{
      const result=await authClient.signIn.social({provider:'google',callbackURL:location.pathname+location.search})
      if(result.error)throw new Error(result.error.message??'Google sign-in failed.')
    }),
    signInWithEmail:(email,password)=>run(async()=>{
      const result=await authClient.signIn.email({email:email.trim(),password})
      if(result.error)throw new Error('Sign-in failed. After migration, continue with Google and set your password again.')
    }),
    signOut:()=>run(async()=>{
      const result=await authClient.signOut()
      if(result.error)throw new Error('Sign out failed. Please retry.')
      setUser(null);clearHttpRequests()
    }),
    setPassword:async password=>{
      if(!uid)throw new Error('Please sign in again.')
      await googlePassword(uid,password)
      setUser(await api<AppUser>(uid,'/account/me'))
    },
  }}>{children}</AuthContext.Provider>
}

