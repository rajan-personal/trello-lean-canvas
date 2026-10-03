import type { LeanCanvas } from './types'
import type { BoardData } from './board'
import type { PendingImport } from './board-storage'
import type { WorkspaceValue } from './persistence-types'
import { api } from './http-client'
import { refreshChanges,subscribeChanges } from './http-changes'
export const prepareWorkspace=(uid:string,local:LeanCanvas[],boards:Record<string,BoardData>={})=>
  api<{consumedLocal:boolean}>(uid,'/workspace/prepare',{local,boards})
export async function saveWorkspaceDiff(uid:string,previous:WorkspaceValue,next:LeanCanvas[],imports:PendingImport[]=[]){
  const value=await api<WorkspaceValue>(uid,'/workspace',{previous,next,imports})
  refreshChanges(uid)
  return value
}
export function subscribeToWorkspace(uid:string,next:(value:WorkspaceValue)=>void,error:(cause:Error)=>void){
  let active=true,revision:number|undefined,running=false,requested=false
  const controller=new AbortController()
  const load=async()=>{
    requested=true
    if(running)return
    running=true
    try{
      while(requested&&active){requested=false;const value=await api<WorkspaceValue>(uid,'/workspace',undefined,controller.signal);if(active)next(value)}
    }catch(cause){revision=undefined;if(active)error(cause as Error)}
    finally{running=false}
  }
  const stop=subscribeChanges(uid,value=>{if(value.workspace!==revision){revision=value.workspace;void load()}},error)
  return()=>{active=false;controller.abort();stop()}
}

