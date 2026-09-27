import { z } from 'zod'
import type { BoardData } from './board'

export const DAY_MS = 86_400_000
export const ACTIVITY_TIME_ZONE = 'Asia/Kolkata' as const
// IST has a fixed UTC+05:30 offset and no daylight-saving changes.
export const activityDay = (time = Date.now()) => Math.floor((time + 19_800_000) / DAY_MS)
export const boardActivitySchema = z.strictObject({
  timeZone: z.literal(ACTIVITY_TIME_ZONE).optional(),
  throughDay: z.number().int().nonnegative(),
  counts: z.array(z.number().int().nonnegative().max(1_000_000)).length(7),
})
export type BoardActivity = z.infer<typeof boardActivitySchema>

// Seven IST dates, oldest first. Legacy UTC totals cannot be rebucketed.
export function activityDays(activity: BoardActivity | undefined, today: number) {
  return Array.from({ length: 7 }, (_, index) => {
    const day = today - 6 + index
    const offset = activity?.timeZone === ACTIVITY_TIME_ZONE ? 6 + day - activity.throughDay : -1
    return { date: new Date(day * DAY_MS).toISOString().slice(0, 10), count: activity?.counts[offset] ?? 0 }
  })
}
export function incrementActivity(activity: BoardActivity | undefined, today = activityDay()): BoardActivity {
  const counts = activityDays(activity, today).map(({ count }) => count)
  counts[6] = Math.min(1_000_000, counts[6] + 1)
  return { timeZone: ACTIVITY_TIME_ZONE, throughDay: today, counts }
}
export function recordTicketActivity(source: BoardData, next: BoardData): BoardData {
  // No reads, column management, duplicate comments, or unchanged saves count.
  return JSON.stringify(source.cards) === JSON.stringify(next.cards)
    ? next : { ...next, activity: incrementActivity(source.activity) }
}
