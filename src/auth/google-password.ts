import { api } from '../data/http-client'
export async function googlePassword(uid:string,password:string){
  const popup=window.open('about:blank','lean-google-verification','popup,width=500,height=650')
  if(!popup)throw new Error('Allow the Google verification popup and try again.')
  try{
    const {url,challenge}=await api<{url:string;challenge:string}>(uid,'/account/google/start',{})
    await new Promise<void>((resolve,reject)=>{
      const finish=(error?:Error)=>{clearInterval(closed);clearTimeout(timeout);window.removeEventListener('message',message);if(error)reject(error);else resolve()}
      const message=(event:MessageEvent)=>{
        if(event.origin===location.origin && event.source===popup &&
          event.data?.type==='lean-google-verified' && event.data.challenge===challenge)finish()
      }
      window.addEventListener('message',message)
      const closed=setInterval(()=>{if(popup.closed)finish(new Error('Google verification was cancelled.'))},500)
      const timeout=setTimeout(()=>finish(new Error('Google verification expired. Try again.')),300000)
      popup.location.href=url
    })
    await api(uid,'/account/password',{password,challenge})
  }finally{popup.close()}
}

