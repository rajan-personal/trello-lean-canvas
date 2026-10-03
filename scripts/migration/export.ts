import { writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { fields } from './firestore-value'
const {values}=parseArgs({options:{project:{type:'string'},out:{type:'string'},'read-time':{type:'string'}}})
if(!values.project||!values.out)throw new Error('--project and --out are required.')
if(!/^[a-z][a-z0-9-]+$/.test(values.project))throw new Error('Invalid project ID.')
const token=process.env.FIREBASE_ACCESS_TOKEN
if(!token)throw new Error('FIREBASE_ACCESS_TOKEN must contain a short-lived IAM access token.')
const readTime=values['read-time']??new Date().toISOString()
if(!Number.isFinite(Date.parse(readTime)))throw new Error('Invalid read time.')
async function request(url:string,body?:unknown){
  const response=await fetch(url,{method:body?'POST':'GET',redirect:'error',headers:{authorization:'Bearer '+token,
    'content-type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)})
  if(!response.ok)throw new Error('Read-only export failed ('+response.status+'). No destination data was changed.')
  return response.json() as Promise<Record<string,unknown>>
}
const resource='projects/'+values.project+'/databases/(default)/documents'
const root='https://firestore.googleapis.com/v1/'+resource
const documents:{path:string;data:Record<string,unknown>}[]=[]
async function visit(parent:string){
  let pageToken:string|undefined
  do{
    const result=await request(parent+':listCollectionIds',{pageSize:1000,readTime,...(pageToken?{pageToken}:{})})
    for(const collection of (result.collectionIds??[]) as string[]){
      let next:string|undefined
      do{
        const url=new URL(parent+'/'+encodeURIComponent(collection))
        url.search=new URLSearchParams({pageSize:'1000',showMissing:'true',readTime,...(next?{pageToken:next}:{})}).toString()
        const page=await request(url.toString())
        for(const doc of (page.documents??[]) as {name:string;fields?:Record<string,Record<string,unknown>>}[]){
          if(!doc.name.startsWith(resource+'/'))throw new Error('Unexpected source document name.')
          const full='https://firestore.googleapis.com/v1/'+doc.name.split('/').map(encodeURIComponent).join('/')
          if(doc.fields)documents.push({path:doc.name.slice(resource.length+1),data:fields(doc.fields)})
          await visit(full)
        }
        next=page.nextPageToken as string|undefined
      }while(next)
    }
    pageToken=result.nextPageToken as string|undefined
  }while(pageToken)
}
await visit(root)
const users:unknown[]=[]
let pageToken:string|undefined
do{
  const url=new URL('https://identitytoolkit.googleapis.com/v1/projects/'+values.project+'/accounts:batchGet')
  url.search=new URLSearchParams({maxResults:'1000',...(pageToken?{nextPageToken:pageToken}:{})}).toString()
  const page=await request(url.toString())
  for(const u of (page.users??[]) as {localId:string;email?:string;displayName?:string;photoUrl?:string;emailVerified?:boolean;disabled?:boolean;providerUserInfo?:{providerId:string;rawId?:string}[]}[]){
    const google=u.providerUserInfo?.find(p=>p.providerId==='google.com')
    if(google&&!google.rawId)throw new Error('Google provider subject missing; do not guess identity.')
    users.push({id:u.localId,email:u.email??'',name:u.displayName??u.email??u.localId,image:u.photoUrl??null,
      emailVerified:!!u.emailVerified,disabled:!!u.disabled,googleAccountId:google?.rawId??null})
  }
  pageToken=page.nextPageToken as string|undefined
}while(pageToken)
await writeFile(values.out,JSON.stringify({version:1,projectId:values.project,readTime,users,documents},null,2)+'\n',{mode:0o600,flag:'wx'})
console.log(JSON.stringify({users:users.length,documents:documents.length,readTime}))

