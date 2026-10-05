import { PGlite } from '@electric-sql/pglite'
import { drizzle as localDrizzle } from 'drizzle-orm/pglite'
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres'
import { database,Pool,type Database,type Sql } from '../server/db/connection'
export async function testDatabase(){
  if(process.env.TEST_POSTGRES_URL){
    const admin=new Pool({connectionString:process.env.TEST_POSTGRES_URL,max:1})
    const schema='lean_test_'+crypto.randomUUID().replaceAll('-','')
    await admin.query('CREATE SCHEMA "'+schema+'"')
    const pool=new Pool({connectionString:process.env.TEST_POSTGRES_URL,max:8,options:'-c search_path='+schema})
    return {db:database(pool),orm:pgDrizzle(pool),exec:async(sql:string)=>{await pool.query(sql)},
      close:async()=>{await pool.end();await admin.query('DROP SCHEMA "'+schema+'" CASCADE');await admin.end()}}
  }
  const pg=new PGlite()
  const db:Database={
    query:async<T extends Record<string,unknown>>(text:string,values?:unknown[])=>({rows:(await pg.query<T>(text,values)).rows}),
    transaction:work=>pg.transaction(async tx=>work({query:async<T extends Record<string,unknown>>(text:string,values?:unknown[])=>({rows:(await tx.query<T>(text,values)).rows})} as Sql)),
  }
  return {db,orm:localDrizzle(pg),exec:async(sql:string)=>{await pg.exec(sql)},close:()=>pg.close()}
}

