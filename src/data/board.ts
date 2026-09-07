import { z } from 'zod'
import { safeCanvasId } from './firestore-model'

const id = z.string().refine(safeCanvasId, 'Unsafe record id')
const title = z.string().trim().min(1).max(500)
export const storyPointValues = [1, 3, 5, 8, 13] as const
export const storyPointsSchema = z.union(storyPointValues.map((value) => z.literal(value)))
export type StoryPoints = z.infer<typeof storyPointsSchema>
export const storyPointLabel = (value: StoryPoints) => value === 13 ? '13+' : String(value)
export const storyPointGuidance: Record<StoryPoints, string> = {
  1: 'Tiny, clear change — e.g., change button text.',
  3: 'Small standard task — e.g., add a profile-edit form.',
  5: 'Moderate complexity — e.g., add image upload.',
  8: 'Complex or risky — e.g., integrate payments.',
  13: 'Very large or uncertain — e.g., replace authentication; split it.',
}
export const boardColumnSchema = z.strictObject({ id, title })
export const boardCardSchema = z.strictObject({
  id, columnId: id, title, description: z.string().max(100000),
  storyPoints: storyPointsSchema.nullable().optional(),
  rank: z.string().regex(/^[0-9a-z]*[1-9a-z]$/).max(2048),
})
export const boardSummaryCardSchema = z.strictObject({
  id, columnId: id, title, storyPoints: storyPointsSchema.nullable().optional(),
  rank: z.string().regex(/^[0-9a-z]*[1-9a-z]$/).max(2048),
})
export const boardSummarySchema = z.strictObject({
  columns: z.array(boardColumnSchema).max(100), cards: z.array(boardSummaryCardSchema),
}).superRefine((data, ctx) => {
  const unique = (values: string[]) => new Set(values).size === values.length
  if (!unique(data.columns.map(({ id }) => id)) || !unique(data.cards.map(({ id }) => id)))
    ctx.addIssue({ code: 'custom', message: 'Duplicate board record ids' })
  if (data.cards.some(({ columnId }) => !data.columns.some(({ id }) => id === columnId)))
    ctx.addIssue({ code: 'custom', message: 'Dangling board reference' })
  if (!unique(data.cards.map(({ columnId, rank }) => `${columnId}/${rank}`)))
    ctx.addIssue({ code: 'custom', message: 'Duplicate card ordering' })
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
export type BoardSummaryCard = z.infer<typeof boardSummaryCardSchema>
export type BoardSummary = z.infer<typeof boardSummarySchema>
export type BoardComment = z.infer<typeof boardCommentSchema>
export type BoardData = z.infer<typeof boardDataSchema>
export const boardSummary = (data: BoardData): BoardSummary => boardSummarySchema.parse({
  columns: data.columns,
  cards: data.cards.map(({ id, columnId, title, storyPoints, rank }) => ({
    id, columnId, title, ...(storyPoints === undefined ? {} : { storyPoints }), rank,
  })),
})
export const defaultBoardColumns: BoardColumn[] = [
  { id: 'backlog', title: 'Backlog' }, { id: 'todo', title: 'Todo' },
  { id: 'in-progress', title: 'In Progress' }, { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' }, { id: 'closed', title: 'Closed' },
]
export const createBoard = (): BoardData => ({
  columns: defaultBoardColumns.map((column) => ({ ...column })), cards: [], comments: [],
})
