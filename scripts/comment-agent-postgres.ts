import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import { z } from 'zod'
const inputSchema=z.strictObject({canvas:z.string().min(1),card:z.string().min(1),id:z.string().min(1).max(200),
  text:z.string().trim().min(1).max(10000)})
export async function postPostgresComment(input:z.infer<typeof inputSchema>,token:string,origin='https://lean.addorimprove.com'){
  const data=inputSchema.parse(input),url=new URL(origin)
  if(url.origin!==origin || (url.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(url.hostname)))
    throw new Error('Use an explicit HTTPS origin, or a loopback development server.')
  if(!token)throw new Error('LEAN_AGENT_TOKEN is required.')
  const response=await fetch(origin+'/api/projects/'+encodeURIComponent(data.canvas)+'/commands',{
    method:'POST',redirect:'error',headers:{authorization:'Bearer '+token,'content-type':'application/json','Idempotency-Key':'agent-'+data.id},
    // Attribution and time are assigned by the server. Fixed placeholders keep retries identical.
    body:JSON.stringify({command:{type:'add-comment',comment:{id:data.id,cardId:data.card,text:data.text,
      authorId:'server',authorName:'Agent',authorType:'agent',createdAt:'2000-01-01T00:00:00.000Z'}}}),
    signal:AbortSignal.timeout(30000)})
  if(!response.ok)throw new Error('Comment failed ('+response.status+'). Retry with the same ID and content.')
  return response.json()
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const {values}=parseArgs({options:Object.fromEntries(['canvas','card','id','origin'].map(k=>[k,{type:'string' as const}]))})
  const chunks:Buffer[]=[]
  for await(const chunk of process.stdin){chunks.push(Buffer.from(chunk));if(chunks.reduce((n,c)=>n+c.length,0)>40000)throw new Error('Comment too large.')}
  console.log(JSON.stringify(await postPostgresComment(inputSchema.parse({canvas:values.canvas,card:values.card,id:values.id,text:Buffer.concat(chunks).toString()}),
    process.env.LEAN_AGENT_TOKEN??'',values.origin)))
}

