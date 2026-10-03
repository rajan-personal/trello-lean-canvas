import { boardDataSchema, boardSummarySchema } from '../../src/data/board'
import type { Sql } from './connection'
export async function readBoard(sql: Sql, projectKey: string, summary = false) {
  const meta = (await sql.query('SELECT board_revision, activity FROM projects WHERE key=$1', [projectKey])).rows[0]
  const columns = (await sql.query('SELECT id,title FROM board_columns WHERE project_key=$1 ORDER BY position', [projectKey])).rows
  const cards = (await sql.query(`SELECT t.id, parent.id AS "parentTicketId", c.id AS "columnId",
    t.title, t.story_points AS "storyPoints", t.rank ${summary ? '' : ', t.description'}
    FROM tickets t JOIN board_columns c ON c.key=t.column_key
    LEFT JOIN tickets parent ON parent.key=t.parent_key WHERE t.project_key=$1 ORDER BY t.rank COLLATE "C",t.id`,
  [projectKey])).rows
  const data = { columns, cards, ...(meta.activity ? { activity: meta.activity } : {}) }
  if (summary) return { data: boardSummarySchema.parse(data), revision: Number(meta.board_revision) }
  const comments = (await sql.query(`SELECT c.id,t.id AS "cardId",c.author_id AS "authorId",
    c.author_name AS "authorName",c.author_type AS "authorType",c.text,c.created_at AS "createdAt"
    FROM comments c JOIN tickets t ON t.key=c.ticket_key WHERE c.project_key=$1 ORDER BY c.created_at,c.id`,
  [projectKey])).rows
  return { data: boardDataSchema.parse({ ...data, comments: comments.map(c => c.authorType === null ? Object.fromEntries(Object.entries(c).filter(([k]) => k !== 'authorType')) : c) }), revision: Number(meta.board_revision) }
}

