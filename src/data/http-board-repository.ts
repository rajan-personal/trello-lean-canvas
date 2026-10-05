import type { BoardRepository } from './board-repository'
import { createBoardRemoteCache } from './board-remote-cache'
import { createBoardSummaryRemoteCache } from './board-summary-remote-cache'
import { readPendingImports,stageBoardImport } from './board-storage'
import type { BoardSnapshot,BoardSummarySnapshot } from './persistence-types'
import type { BoardCommand } from './board-mutations'
import type { BoardVersion } from './board-remote-cache'
import { api } from './http-client'
import { refreshChanges,subscribeChanges } from './http-changes'
export function createHttpBoardRepository(uid:string,storage:Storage):BoardRepository{
  const pendingKey='lean-canvas:board-imports:'+uid
  const live=new Map<string,ReturnType<typeof createBoardRemoteCache>>()
  const summaries=new Map<string,ReturnType<typeof createBoardSummaryRemoteCache>>()
  const path=(id:string)=>'/projects/'+encodeURIComponent(id)
  const load=(id:string)=>api<BoardSnapshot>(uid,path(id)+'/board')
  const subscribe=(id:string,next:(version:BoardVersion|undefined)=>void,error:(error:Error)=>void)=>
    subscribeChanges(uid,value=>{const v=value.boards.find(b=>b.id===id);next(v?{revision:v.revision,status:'active'}:undefined)},error)
  const mutate=async(id:string,command:BoardCommand,source?:BoardSnapshot)=>{
    const revision=command.type==='add-comment'?undefined:(source??await load(id)).revision
    const result=await api<BoardSnapshot>(uid,path(id)+'/commands',{command,revision})
    refreshChanges(uid)
    return command.type==='add-comment'?undefined:result
  }
  return{
    initialize:async()=>{},
    load:async id=>structuredClone((await(live.get(id)?.load()??load(id))).data),
    loadSummary:async id=>(await(summaries.get(id)?.load()??api<BoardSummarySnapshot>(uid,path(id)+'/board?summary=true'))).data,
    dispatch:async(id,command)=>{if(live.has(id))await live.get(id)!.dispatch(command);else await mutate(id,command)},
    subscribe(id,next,error){
      const cache=createBoardRemoteCache({load:()=>load(id),mutate:(command,source)=>mutate(id,command,source),
        subscribe:(changed,failed)=>subscribe(id,changed,failed)})
      live.set(id,cache)
      const stop=cache.subscribe(next,error)
      return()=>{stop();if(live.get(id)===cache)live.delete(id)}
    },
    subscribeSummary(id,next,error){
      const cache=createBoardSummaryRemoteCache({load:()=>api<BoardSummarySnapshot>(uid,path(id)+'/board?summary=true'),
        subscribe:(changed,failed)=>subscribe(id,changed,failed)})
      summaries.set(id,cache)
      const stop=cache.subscribe(next,error)
      return()=>{stop();if(summaries.get(id)===cache)summaries.delete(id)}
    },
    stageImport:(canvas,board,importId)=>stageBoardImport(storage,pendingKey,canvas,board,importId),
    pendingImports:()=>readPendingImports(storage,pendingKey),
    async sync(canvases){
      for(const pending of readPendingImports(storage,pendingKey)){
        if(!canvases.some(c=>c.id===pending.canvas.id))continue
        await api(uid,path(pending.canvas.id)+'/import',pending)
        storage.setItem(pendingKey,JSON.stringify(readPendingImports(storage,pendingKey).filter(p=>p.importId!==pending.importId)))
      }
      refreshChanges(uid)
    },
    removeLocal(ids){storage.setItem(pendingKey,JSON.stringify(readPendingImports(storage,pendingKey).filter(p=>!ids.includes(p.canvas.id))))},
    deletingCanvasIds:async()=>[],
  }
}

