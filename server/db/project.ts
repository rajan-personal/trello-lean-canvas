import type { Sql } from './connection'
import { check } from '../errors'
import type { Principal } from '../env'
export interface ProjectRow extends Record<string, unknown> {
  key: string; owner_id: string; id: string; payload: unknown; revision: number; board_revision: number
}
export async function project(sql: Sql, principal: Principal, id: string, lock = false): Promise<ProjectRow> {
  const result = await sql.query<ProjectRow>(
    `SELECT p.* FROM projects p WHERE p.id=$1 AND ${principal.kind === 'user' ? 'p.owner_id=$2' : 'p.key=$2'}
     ${lock ? 'FOR UPDATE' : ''}`, [id, principal.kind === 'user' ? principal.id : principal.projectKey])
  check(result.rows[0], 'Project not found.', 404)
  return result.rows[0]
}

