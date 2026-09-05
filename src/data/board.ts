import { z } from 'zod'
import { safeCanvasId } from './firestore-model'

const id = z.string().refine(safeCanvasId, 'Unsafe record id')
const title = z.string().trim().min(1).max(500)
export const boardColumnSchema = z.strictObject({ id, title })
export const boardCardSchema = z.strictObject({
  id, columnId: id, title, description: z.string().max(100000),
  rank: z.string().regex(/^[0-9a-z]*[1-9a-z]$/).max(2048),
})
export const boardCommentSchema = z.strictObject({
  id, cardId: id, authorId: z.string().min(1), authorName: title,
  text: z.string().trim().min(1).max(10000), createdAt: z.iso.datetime(),
})
export const boardDataSchema = z.strictObject({
  columns: z.array(boardColumnSchema).max(100),
  cards: z.array(boardCardSchema), comments: z.array(boardCommentSchema),
}).superRefine((data, ctx) => {
  const unique = (values: string[]) => new Set(values).size === values.length
  if (!unique(data.columns.map((column) => column.id)) ||
      !unique(data.cards.map((card) => card.id)) ||
      !unique(data.comments.map((comment) => comment.id)))
    ctx.addIssue({ code: 'custom', message: 'Duplicate board record ids' })
  if (data.cards.some((card) => !data.columns.some((column) => column.id === card.columnId)) ||
      data.comments.some((comment) => !data.cards.some((card) => card.id === comment.cardId)))
    ctx.addIssue({ code: 'custom', message: 'Dangling board reference' })
  if (!unique(data.cards.map((card) => `${card.columnId}/${card.rank}`)))
    ctx.addIssue({ code: 'custom', message: 'Duplicate card ordering' })
})
export type BoardColumn = z.infer<typeof boardColumnSchema>
export type BoardCard = z.infer<typeof boardCardSchema>
export type BoardComment = z.infer<typeof boardCommentSchema>
export type BoardData = z.infer<typeof boardDataSchema>
export const defaultBoardColumns: BoardColumn[] = [
  { id: 'backlog', title: 'Backlog' }, { id: 'todo', title: 'Todo' },
  { id: 'in-progress', title: 'In Progress' }, { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' }, { id: 'closed', title: 'Closed' },
]
export const createBoard = (): BoardData => ({
  columns: defaultBoardColumns.map((column) => ({ ...column })), cards: [], comments: [],
})
