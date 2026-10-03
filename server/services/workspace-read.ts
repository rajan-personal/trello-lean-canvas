import type { Sql } from '../db/connection'
import { canvasInput } from '../validation'
import type { WorkspaceValue } from '../../src/data/persistence-types'
export async function workspace(sql: Sql, uid: string): Promise<WorkspaceValue> {
  const meta = (await sql.query('SELECT order_revision FROM workspaces WHERE owner_id=$1',[uid])).rows[0]
  const projects = (await sql.query('SELECT id,payload,revision FROM projects WHERE owner_id=$1 ORDER BY position',[uid])).rows
  return { canvases: projects.map(p => canvasInput.parse(p.payload)),
    revisions: Object.fromEntries(projects.map(p => [String(p.id),Number(p.revision)])), orderRevision:Number(meta?.order_revision ?? 1) }
}

