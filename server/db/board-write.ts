import type { BoardData } from '../../src/data/board'
import { hierarchyLayers } from '../../src/data/ticket-hierarchy'
import type { Sql } from './connection'
export async function writeBoard(sql: Sql, key: string, board: BoardData) {
  const columns = new Map<string,string>()
  for (const [position,c] of board.columns.entries()) {
    const row = (await sql.query(`INSERT INTO board_columns(project_key,id,title,position) VALUES($1,$2,$3,$4)
      ON CONFLICT(project_key,id) DO UPDATE SET title=excluded.title,position=excluded.position RETURNING key`,
    [key,c.id,c.title,position])).rows[0]
    columns.set(c.id,String(row.key))
  }
  const tickets = new Map<string,string>()
  for (const layer of hierarchyLayers(board.cards)) for (const t of layer) {
    const row = (await sql.query(`INSERT INTO tickets(project_key,id,parent_key,column_key,title,description,story_points,rank)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(project_key,id) DO UPDATE SET
      column_key=excluded.column_key,title=excluded.title,description=excluded.description,
      story_points=excluded.story_points,rank=excluded.rank RETURNING key`,
    [key,t.id,t.parentTicketId ? tickets.get(t.parentTicketId) : null,columns.get(t.columnId),t.title,t.description,t.storyPoints ?? null,t.rank])).rows[0]
    tickets.set(t.id,String(row.key))
  }
  await sql.query('DELETE FROM tickets WHERE project_key=$1 AND NOT(id=ANY($2::text[]))', [key,board.cards.map(t => t.id)])
  await sql.query('DELETE FROM board_columns WHERE project_key=$1 AND NOT(id=ANY($2::text[]))', [key,board.columns.map(c => c.id)])
  // Import only. Ordinary comment appends use their own idempotent, attributed path.
  for (const c of board.comments) await sql.query(`INSERT INTO comments
    (project_key,id,ticket_key,author_id,author_name,author_type,text,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT(project_key,id) DO NOTHING`, [key,c.id,tickets.get(c.cardId),c.authorId,c.authorName,c.authorType ?? null,c.text,c.createdAt])
  await sql.query('UPDATE projects SET activity=$2 WHERE key=$1', [key,JSON.stringify(board.activity ?? null)])
}

