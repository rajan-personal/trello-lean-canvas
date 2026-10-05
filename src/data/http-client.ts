export class HttpError extends Error {
  constructor(public status:number,message:string){super(message)}
}
const pending=new Map<string,string>()
export async function api<T>(uid:string,path:string,body?:unknown,signal?:AbortSignal):Promise<T> {
  const signature=uid+':'+path+':'+JSON.stringify(body)
  const headers:Record<string,string>={'x-lean-user':uid}
  if(body!==undefined){
    headers['content-type']='application/json'
    if(!pending.has(signature)) pending.set(signature,crypto.randomUUID())
    headers['Idempotency-Key']=pending.get(signature)!
  }
  const response=await fetch('/api'+path,{method:body===undefined?'GET':'POST',credentials:'same-origin',headers,
    ...(body!==undefined?{body:JSON.stringify(body)}:{}),signal})
  const value=await response.json().catch(()=>({error:'Server returned an invalid response.'}))
  if(!response.ok) {
    if(response.status<500 && response.status!==409) pending.delete(signature)
    throw new HttpError(response.status,value.error??'Request failed.')
  }
  pending.delete(signature)
  return value as T
}
export function clearHttpRequests(){pending.clear()}

