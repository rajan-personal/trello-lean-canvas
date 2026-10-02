import { expect, test } from '@playwright/test'
import { activityDay, ACTIVITY_TIME_ZONE } from '../src/data/board-activity'
import { boards, openList, projects } from './support/ticket-list'

for (const width of [320, 1440]) {
  test(`seven-day sparkline supports keyboard/touch details and live changes at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await openList(page)
    const row = page.locator('.ticket-project-row[data-project-id="b"]')
    const activity = row.locator('.ticket-activity')
    const line = activity.locator('polyline')
    await expect(activity.locator('svg')).toHaveAttribute('data-state', 'empty')
    expect((await line.getAttribute('points'))!.split(' ').map(point => Number(point.split(',')[1]))).toEqual(Array(7).fill(26))
    const summary = activity.locator('summary')
    await expect(summary).toHaveText('')
    await summary.focus(); await summary.press('Enter')
    await expect(page).toHaveURL('/tickets')
    await expect(activity.locator('li')).toHaveCount(7)
    await expect(activity.getByText(/including today \(IST\)/)).toBeVisible()
    await expect(activity.getByText('0 recorded ticket changes', { exact: true })).toBeVisible()
    const bounds = await activity.locator('.ticket-activity-breakdown').boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
    await summary.press('Escape')
    await expect(activity).not.toHaveAttribute('open', '')
    await page.getByRole('button', { name: 'Open board for Beta project' }).click()
    await page.getByRole('region', { name: 'Todo', exact: true }).getByRole('button', { name: 'Add a card' }).click()
    await page.getByRole('textbox', { name: 'Card title', exact: true }).fill('Count this activity')
    await page.getByRole('button', { name: 'Add card', exact: true }).click()
    await page.getByRole('button', { name: 'All tickets', exact: true }).click()
    await expect(summary).toHaveAttribute('aria-label', 'Activity for Beta project: 1 recorded change in the last 7 days')
    await expect(activity.locator('svg')).toHaveAttribute('data-state', 'recorded')
    expect((await line.getAttribute('points'))!.split(' ').map(point => Number(point.split(',')[1]))).toEqual([26, 26, 26, 26, 26, 26, 2])
    await summary.click()
    await expect(activity.getByText('1 recorded ticket change', { exact: true })).toBeVisible()
    await expect(page).toHaveURL('/tickets')
  })
}

test('sparklines plot the seven actual daily counts with one scale across projects', async ({ page }) => {
  const now = Date.parse('2026-09-27T12:00:00Z')
  await page.clock.setFixedTime(new Date(now))
  const activity = (counts: number[]) => ({ timeZone: ACTIVITY_TIME_ZONE, throughDay: activityDay(now), counts })
  await openList(page, { projects, boards: {
    ...boards,
    a: { ...boards.a, activity: activity([0, 2, 4, 1, 0, 3, 2]) },
    b: { ...boards.b, activity: activity([0, 1, 0, 0, 2, 0, 0]) },
  } })
  const alpha = page.locator('.ticket-project-row[data-project-id="a"] .ticket-activity')
  const beta = page.locator('.ticket-project-row[data-project-id="b"] .ticket-activity')
  const alphaPoints = (await alpha.locator('polyline').getAttribute('points'))!.split(' ').map(point => point.split(',').map(Number))
  expect(alphaPoints.map(point => point[1])).toEqual([26, 14, 2, 20, 26, 8, 14])
  expect(alphaPoints.map(point => point[0])).toEqual([2, 18.67, 35.33, 52, 68.67, 85.33, 102])
  const betaPoints = (await beta.locator('polyline').getAttribute('points'))!.split(' ').map(point => point.split(',').map(Number))
  expect(betaPoints.map(point => point[1])).toEqual([26, 20, 26, 26, 14, 26, 26])
  await alpha.locator('summary').click()
  await expect(alpha.locator('li span')).toHaveText(['0', '2', '4', '1', '0', '3', '2'])
  await expect(alpha.locator('time').last()).toHaveAttribute('datetime', '2026-09-27')
})
