import { expect, test } from '@playwright/test'
import { activityDay, ACTIVITY_TIME_ZONE } from '../src/data/board-activity'
import { boards, openList, projects } from './support/ticket-list'

const now = new Date('2026-10-04T18:29:30Z') // Just before midnight IST.
const today = activityDay(now.getTime())
const activity = (throughDay: number, counts = [0, 0, 0, 0, 0, 0, 1]) => ({ timeZone: ACTIVITY_TIME_ZONE, throughDay, counts })

test('hides inactive projects and their totals, keeps the oldest included day and sidebar access', async ({ page }) => {
  await page.clock.setFixedTime(now)
  await openList(page, { projects, boards: {
    a: { ...boards.a, activity: activity(today - 6) },
    b: { ...boards.b, activity: activity(today - 7) },
    c: { ...boards.c, activity: activity(today, Array(7).fill(0)) },
  } }, 1)
  await expect(page.locator('.ticket-project-open')).toHaveText(['Alpha project'])
  await expect(page.getByRole('list', { name: 'Active tickets by status' }).getByRole('listitem'))
    .toHaveText(['Todo0', 'In Progress1', 'In Review2'])
  await expect(page.locator('.canvas-nav-item').filter({ hasText: 'Beta project' })).toBeVisible()
})

test('shows an empty state for missing or legacy activity and brings a project back after activity', async ({ page }) => {
  await page.clock.setFixedTime(now)
  const seed = {
    a: { ...boards.a, activity: undefined },
    b: { ...boards.b, activity: { throughDay: today, counts: [0, 0, 0, 0, 0, 0, 5] } },
    c: { ...boards.c, activity: activity(today, Array(7).fill(0)) },
  }
  await openList(page, { projects, boards: seed }, 0)
  await expect(page.getByRole('main', { name: 'All tickets' }).getByRole('status')).toHaveText('No project activity in the last 7 days.')
  await expect(page.getByRole('list', { name: 'Active tickets by status' })).toHaveCount(0)
  await page.evaluate((updated) => {
    localStorage.setItem('lean-canvas:boards:v1', JSON.stringify(updated))
    window.dispatchEvent(new Event('storage'))
  }, { ...seed, b: { ...boards.b, activity: activity(today) } })
  await expect(page.locator('.ticket-project-open')).toHaveText(['Beta project'])
  await expect(page.getByRole('list', { name: 'Active tickets by status' }).getByRole('listitem'))
    .toHaveText(['Todo1', 'In Progress0', 'In Review1'])
})

test('ages a project out at IST midnight without a page reload', async ({ page }) => {
  await page.clock.install({ time: now })
  await openList(page, { projects: [projects[0]], boards: { a: { ...boards.a, activity: activity(today - 6) } } })
  await page.clock.fastForward(60_000)
  await expect(page.locator('.ticket-project-row')).toHaveCount(0)
  await expect(page.getByRole('main', { name: 'All tickets' }).getByRole('status')).toHaveText('No project activity in the last 7 days.')
})
