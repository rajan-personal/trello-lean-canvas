import type { Sql } from './connection'
import { check } from '../errors'
export async function digest(value: unknown) {
  const canonical = (v: unknown): unknown => Array.isArray(v) ? v.map(canonical) :
    v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)).map(([k,x]) => [k,canonical(x)])) : v
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(canonical(value))))
  return [...new Uint8Array(bytes)].map(v => v.toString(16).padStart(2,'0')).join('')
}
export async function receipt<T>(sql: Sql, owner: string, id: string, payload: unknown, work: () => Promise<T>): Promise<T> {
  check(id.length > 0 && id.length <= 200, 'A stable Idempotency-Key is required.', 400)
  // A transaction-level lock also serializes first use, before a receipt exists.
  await sql.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [owner + ':' + id])
  const hash = await digest(payload)
  const prior = (await sql.query('SELECT digest,result FROM command_receipts WHERE owner_id=$1 AND id=$2', [owner,id])).rows[0]
  if (prior) { check(prior.digest === hash, 'Request ID already used for different content.'); return prior.result as T }
  const result = await work()
  await sql.query('INSERT INTO command_receipts(owner_id,id,digest,result) VALUES($1,$2,$3,$4)', [owner,id,hash,JSON.stringify(result)])
  return result
}

