import { Pool } from 'pg'
export interface Sql {
  query<T extends Record<string, unknown> = Record<string, unknown>>(text: string, values?: unknown[]): Promise<{ rows: T[] }>
}
export interface Database extends Sql {
  transaction<T>(work: (sql: Sql) => Promise<T>): Promise<T>
}
export function database(pool: Pool): Database {
  return {
    query: (text, values) => pool.query(text, values),
    async transaction(work) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ')
        const value = await work(client)
        await client.query('COMMIT')
        return value
      } catch (error) { await client.query('ROLLBACK'); throw error }
      finally { client.release() }
    },
  }
}
export { Pool }

