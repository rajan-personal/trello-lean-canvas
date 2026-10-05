import type { LeanCanvas } from './types'
import { safeCanvasId } from './persistence-types'
export async function migrationCanvases(canvases: LeanCanvas[]): Promise<LeanCanvas[]> {
  const counts=new Map<string,number>()
  canvases.forEach(({id})=>counts.set(id,(counts.get(id)??0)+1))
  return Promise.all(canvases.map(async(canvas,index)=>{
    if(safeCanvasId(canvas.id) && counts.get(canvas.id)===1) return canvas
    const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([index,canvas])))
    const hash=[...new Uint8Array(bytes)].map(byte=>byte.toString(16).padStart(2,'0')).join('')
    return {...canvas,id:'migrated-'+hash}
  }))
}

