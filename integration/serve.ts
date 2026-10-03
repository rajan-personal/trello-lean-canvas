import { createServer } from 'node:http'
import { fixture } from './fixture'
const f=await fixture('http://127.0.0.1:4173')
const cookie=await f.login()
await f.request('/api/workspace',f.initial,cookie)
await f.request('/api/projects/project/commands',{command:{type:'create-card',id:'parent',title:'PostgreSQL migration',columnId:'todo'},revision:1},cookie)
await f.request('/api/projects/project/commands',{command:{type:'create-card',id:'child',title:'Verify account isolation',columnId:'review',parentTicketId:'parent'},revision:2},cookie)
const server=createServer(async(req,res)=>{
  try{
    const chunks:Buffer[]=[]
    for await(const chunk of req)chunks.push(Buffer.from(chunk))
    const headers=new Headers()
    for(const [key,value]of Object.entries(req.headers))if(value)headers.set(key,Array.isArray(value)?value.join(','):value)
    const response=await f.app.fetch(new Request(f.env.BETTER_AUTH_URL+req.url,{method:req.method,headers,
      ...(!['GET','HEAD'].includes(req.method??'GET')?{body:Buffer.concat(chunks)}:{})}))
    res.statusCode=response.status
    for(const [key,value]of response.headers)if(key!=='set-cookie')res.setHeader(key,value)
    if(response.headers.getSetCookie().length)res.setHeader('set-cookie',response.headers.getSetCookie())
    res.end(Buffer.from(await response.arrayBuffer()))
  }catch{res.statusCode=500;res.end('Test server request failed')}
})
server.listen(8787,'127.0.0.1',()=>console.log('Test API ready on 8787'))
process.on('SIGTERM',()=>{server.close(()=>{void f.pg.close().then(()=>process.exit())})})

