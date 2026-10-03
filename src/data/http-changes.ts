import { api } from './http-client'
interface Changes {workspace:number;boards:{id:string;revision:number}[]}
type Listener={next:(value:Changes)=>void;error:(error:Error)=>void}
const feeds=new Map<string,ReturnType<typeof createFeed>>()
function createFeed(uid:string){
  const listeners=new Set<Listener>()
  let stopped=false,timer:ReturnType<typeof setTimeout>|undefined,loading=false,delay=2000
  let last:Changes|undefined
  const controller=new AbortController()
  const poll=async()=>{
    if(stopped||loading)return
    if(globalThis.document?.hidden){timer=setTimeout(()=>void poll(),2000);return}
    loading=true
    try{
      const value=await api<Changes>(uid,'/changes',undefined,controller.signal)
      if(stopped)return
      last=value;delay=2000
      for(const listener of listeners)listener.next(value)
    }catch(cause){
      if(!stopped){delay=Math.min(delay*2,30000);for(const listener of listeners)listener.error(cause as Error)}
    }finally{
      loading=false
      if(!stopped){clearTimeout(timer);timer=setTimeout(()=>void poll(),delay)}
    }
  }
  const wake=()=>{clearTimeout(timer);void poll()}
  globalThis.addEventListener?.('focus',wake)
  globalThis.addEventListener?.('online',wake)
  globalThis.document?.addEventListener('visibilitychange',wake)
  return{
    wake,
    add(listener:Listener){
      listeners.add(listener)
      if(last)listener.next(last)
      wake()
      return()=>{
        listeners.delete(listener)
        if(listeners.size)return
        stopped=true;clearTimeout(timer);controller.abort();feeds.delete(uid)
        globalThis.removeEventListener?.('focus',wake);globalThis.removeEventListener?.('online',wake)
        globalThis.document?.removeEventListener('visibilitychange',wake)
      }
    },
  }
}
export function subscribeChanges(uid:string,next:Listener['next'],error:Listener['error']){
  let feed=feeds.get(uid)
  if(!feed){feed=createFeed(uid);feeds.set(uid,feed)}
  return feed.add({next,error})
}
export const refreshChanges=(uid:string)=>feeds.get(uid)?.wake()

