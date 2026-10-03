import type { Sql } from '../db/connection'
import type { BoardData } from '../../src/data/board'
import { boardDataSchema } from '../../src/data/board'
import { check } from '../errors'
import { digest } from '../db/receipt'
import { writeBoard } from '../db/board-write'
export async function importBoard(sql: Sql, key: string, board: BoardData, importId: string) {
  const hash = await digest(board)
  const old = (await sql.query('SELECT * FROM board_imports WHERE project_key=$1',[key])).rows[0]
  if (old) { check(old.import_id===importId && old.digest===hash,'A different import exists.'); return }
  const count = (await sql.query('SELECT count(*)::int AS n FROM tickets WHERE project_key=$1',[key])).rows[0]
  const current=(await sql.query('SELECT board_revision FROM projects WHERE key=$1',[key])).rows[0]
  check(count.n===0 && current.board_revision===1,'Cannot import over an existing board.')
  await writeBoard(sql,key,boardDataSchema.parse(board))
  await sql.query('UPDATE projects SET board_revision=board_revision+1 WHERE key=$1',[key])
  await sql.query('UPDATE workspaces SET change_revision=change_revision+1 WHERE owner_id=(SELECT owner_id FROM projects WHERE key=$1)',[key])
  await sql.query('INSERT INTO board_imports(project_key,import_id,digest) VALUES($1,$2,$3)',[key,importId,hash])
}

