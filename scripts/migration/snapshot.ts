import { z } from 'zod'
import { canvasDocumentSchema,workspaceSchema,legacyWorkspaceSchema } from '../../src/data/canvas-schema'
import { boardDataSchema,createBoard } from '../../src/data/board'
import { boardRecordSchema } from '../../src/data/board-firestore-model'
import type { BoardData } from '../../src/data/board'
import type { LeanCanvas } from '../../src/data/types'
export const snapshotSchema=z.strictObject({
  version:z.literal(1),projectId:z.string().min(1),readTime:z.string(),
  users:z.array(z.strictObject({id:z.string(),email:z.string(),name:z.string(),image:z.string().nullable(),
    emailVerified:z.boolean(),disabled:z.boolean(),googleAccountId:z.string().nullable()})),
  documents:z.array(z.strictObject({path:z.string(),data:z.record(z.string(),z.unknown())})),
})
export type Snapshot=z.infer<typeof snapshotSchema>
export interface OwnerImport {user:Snapshot['users'][number];orderRevision:number;projects:{canvas:LeanCanvas;revision:number;board:BoardData;boardRevision:number;source:unknown}[]}
export function inspectSnapshot(value:unknown):OwnerImport[]{
  const source=snapshotSchema.parse(value),docs=new Map(source.documents.map(d=>[d.path,d.data]))
  if(docs.size!==source.documents.length)throw new Error('Duplicate source paths.')
  if(new Set(source.users.map(u=>u.id)).size!==source.users.length)throw new Error('Duplicate source user IDs.')
  const emails=new Set<string>(),subjects=new Set<string>()
  const owners:OwnerImport[]=[]
  for(const user of source.users.filter(u=>u.googleAccountId)){
    const email=user.email.trim().toLowerCase()
    if(!email || emails.has(email)||subjects.has(user.googleAccountId!))throw new Error('Ambiguous Google identity or email.')
    emails.add(email);subjects.add(user.googleAccountId!)
    const path='users/'+user.id+'/workspaces/default',meta=docs.get(path)
    const current=meta?.schemaVersion===2?workspaceSchema.parse(meta):null
    const legacy=meta&&!current?legacyWorkspaceSchema.parse(meta).canvases:null
    const order=current?.canvasOrder??legacy?.map(c=>c.id)??[]
    const projects=order.map(id=>{
      const prefix=path+'/canvases/'+id,raw=docs.get(prefix)
      if(!raw&&!legacy)throw new Error('Missing canvas '+prefix)
      const {schemaVersion:_s,updatedAt:_t,legacyId:_l,revision,...canvas}=raw?
        canvasDocumentSchema.parse(raw):{...legacy!.find(c=>c.id===id)!,revision:1,schemaVersion:1,updatedAt:null,legacyId:undefined}
      void _s;void _t;void _l
      const board=readSourceBoard(docs,prefix+'/boards/default')
      return {canvas:{...canvas,id} as LeanCanvas,revision,...board,source:raw??canvas}
    })
    owners.push({user:{...user,email},orderRevision:current?.orderRevision??1,projects})
  }
  const known=new Set(owners.flatMap(o=>o.projects.map(p=>'users/'+o.user.id+'/workspaces/default/canvases/'+p.canvas.id)))
  for(const [path,data] of docs){
    if(/^users\/[^/]+$/.test(path)&&Object.keys(data).length===0)continue
    if(/^users\/[^/]+\/workspaces\/default$/.test(path) && owners.some(o=>path==='users/'+o.user.id+'/workspaces/default'))continue
    const match=path.match(/^(users\/[^/]+\/workspaces\/default\/canvases\/[^/]+)(.*)$/)
    if(!match||!known.has(match[1])||!/^($|\/boards\/default(?:\/(?:cards|comments|childCounts)\/[^/]+)?)$/.test(match[2]))
      throw new Error('Unmapped or orphan source path: '+path)
  }
  return owners
}
function readSourceBoard(docs:Map<string,Record<string,unknown>>,path:string){
  const meta=docs.get(path)
  if(!meta)return {board:createBoard(),boardRevision:1}
  const record=boardRecordSchema.parse(meta)
  if(record.canvasId!==path.split('/').at(-3))throw new Error('Invalid board project linkage.')
  if(record.status!=='active')throw new Error('Recover source board before importing: '+path+' ('+record.status+')')
  const children=(kind:string)=>[...docs].filter(([p])=>p.startsWith(path+'/'+kind+'/')).map(([p,value])=>{
    const {canvasId:_c,schemaVersion:_s,updatedAt:_t,...rest}=value
    if(_s!==1||_c!==record.canvasId)throw new Error('Invalid child linkage: '+p)
    void _t
    return {...rest,id:p.slice(p.lastIndexOf('/')+1)}
  })
  const board=boardDataSchema.parse({columns:record.columns,cards:children('cards'),comments:children('comments'),
    ...(record.activity?{activity:record.activity}:{})})
  for(const parent of board.cards){
    const n=board.cards.filter(c=>c.parentTicketId===parent.id).length
    if(Number(docs.get(path+'/childCounts/'+parent.id)?.count??0)!==n)throw new Error('Source child count mismatch: '+parent.id)
  }
  return {board,boardRevision:record.revision}
}
