import { writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { Pool } from '../../server/db/connection'
import { digest } from '../../server/db/receipt'
const {values}=parseArgs({options:Object.fromEntries(['owner','canvas','name','out','expires','revoke'].map(k=>[k,{type:'string' as const}]))})
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required for the trusted provisioner.')
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1})
try{
  if(values.revoke){await pool.query('UPDATE agent_credentials SET revoked_at=now() WHERE id=$1',[values.revoke]);console.log('Revoked.')}
  else{
    if(!values.owner||!values.canvas||!values.name||!values.out||!values.expires)throw new Error('--owner --canvas --name --out --expires are required.')
    const expiry=new Date(values.expires)
    if(!Number.isFinite(+expiry)||+expiry<=Date.now())throw new Error('Use an explicit future expiry.')
    const project=(await pool.query('SELECT key FROM projects WHERE owner_id=$1 AND id=$2',[values.owner,values.canvas])).rows[0]
    if(!project)throw new Error('Project not found.')
    const token=crypto.randomUUID()+crypto.randomUUID(),id=crypto.randomUUID()
    // Write once to a private file; never expose the token in console output.
    await writeFile(values.out,token+'\n',{mode:0o600,flag:'wx'})
    await pool.query('INSERT INTO agent_credentials(id,project_key,name,token_hash,expires_at) VALUES($1,$2,$3,$4,$5)',
      [id,project.key,values.name,await digest(token),expiry])
    console.log(JSON.stringify({credentialId:id,expiresAt:expiry.toISOString()}))
  }
}finally{await pool.end()}

