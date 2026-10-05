import type { z } from 'zod'
import type { Database, Sql } from '../db/connection'
import { workspaceInput } from '../validation'
import { workspace } from './workspace-read'
import { check } from '../errors'
import { receipt } from '../db/receipt'
import { createBoard } from '../../src/data/board'
import { equalCanvas } from '../../src/data/persistence-types'
import { writeBoard } from '../db/board-write'
import { importBoard } from './import'
type Input = z.infer<typeof workspaceInput>
export async function saveWorkspace(db: Database, uid: string, input: Input, requestId: string) {
  return db.transaction(async sql => {
    await sql.query('INSERT INTO workspaces(owner_id) VALUES($1) ON CONFLICT DO NOTHING',[uid])
    await sql.query('SELECT owner_id FROM workspaces WHERE owner_id=$1 FOR UPDATE',[uid])
    return receipt(sql,uid,requestId,input,async () => {
      await applyDiff(sql,uid,input)
      return workspace(sql,uid)
    })
  })
}
async function applyDiff(sql: Sql, uid: string, { previous,next,imports }: Input) {
  check(new Set(next.map(c=>c.id)).size===next.length,'Duplicate project IDs.',400)
  check(new Set(previous.canvases.map(c=>c.id)).size===previous.canvases.length,'Duplicate baseline IDs.',400)
  const current = await workspace(sql,uid)
  const before = new Map(previous.canvases.map(c=>[c.id,c]))
  const after = new Map(next.map(c=>[c.id,c]))
  const exists = new Map(current.canvases.map(c=>[c.id,c]))
  const orderChanged = JSON.stringify(previous.canvases.map(c=>c.id))!==JSON.stringify(next.map(c=>c.id))
  if (orderChanged) check(previous.orderRevision===current.orderRevision,'Project order changed. Reload before reordering.')
  for (const old of previous.canvases) if (!after.has(old.id)) {
    check(current.revisions[old.id]===previous.revisions[old.id],'Project changed before deletion.')
    await sql.query('DELETE FROM projects WHERE owner_id=$1 AND id=$2',[uid,old.id])
  }
  for (const [position,c] of next.entries()) {
    if (equalCanvas(before.get(c.id),c)) continue
    const old = exists.get(c.id)
    if (before.has(c.id)) check(old && current.revisions[c.id]===previous.revisions[c.id],'Project changed in another session. Copy your draft before reloading.')
    else check(!old,'Project ID already exists.')
    const row = (await sql.query(`INSERT INTO projects(owner_id,id,payload,position) VALUES($1,$2,$3,$4)
      ON CONFLICT(owner_id,id) DO UPDATE SET payload=excluded.payload,revision=projects.revision+1 RETURNING key`,
    [uid,c.id,JSON.stringify(c),position])).rows[0]
    if (!old) {
      const pending = imports.find(entry=>entry.canvas.id===c.id)
      if (pending) await importBoard(sql,String(row.key),pending.board,pending.importId)
      else await writeBoard(sql,String(row.key),createBoard())
    }
  }
  if (orderChanged) {
    const stored = (await sql.query('SELECT id FROM projects WHERE owner_id=$1',[uid])).rows
    check(stored.length===next.length && stored.every(p=>after.has(String(p.id))),'Project membership changed.')
    for (const [i,c] of next.entries()) await sql.query('UPDATE projects SET position=$3 WHERE owner_id=$1 AND id=$2',[uid,c.id,i])
    await sql.query('UPDATE workspaces SET order_revision=order_revision+1 WHERE owner_id=$1',[uid])
  }
  await sql.query('UPDATE workspaces SET change_revision=change_revision+1 WHERE owner_id=$1',[uid])
}

