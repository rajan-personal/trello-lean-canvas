import { readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { database,Pool } from '../../server/db/connection'
import { inspectSnapshot } from './snapshot'
import { migrateSnapshot } from './import'
const {values}=parseArgs({options:{source:{type:'string'},apply:{type:'boolean'},target:{type:'string'}}})
if(!values.source)throw new Error('--source is required. Default is a read-only source audit.')
const source=JSON.parse(await readFile(values.source,'utf8'))
const owners=inspectSnapshot(source)
if(!values.apply)console.log(JSON.stringify({mode:'dry-run',users:owners.length,projects:owners.flatMap(o=>o.projects).length,
  tickets:owners.flatMap(o=>o.projects).flatMap(p=>p.board.cards).length,comments:owners.flatMap(o=>o.projects).flatMap(p=>p.board.comments).length}))
else{
  if(!values.target||values.target!==process.env.MIGRATION_TARGET)throw new Error('--target must match MIGRATION_TARGET.')
  if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required.')
  const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1})
  try{console.log(JSON.stringify(await migrateSnapshot(database(pool),source,true)))}finally{await pool.end()}
}

