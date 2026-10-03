import { expect, test } from '@playwright/test'
import { activityDay, ACTIVITY_TIME_ZONE } from '../src/data/board-activity'
import { boards, openList, projects } from './support/ticket-list'

for (const width of [320, 1440]) {
  test(`seven-day activity bars support keyboard/touch details and live changes at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await openList(page)
    const row = page.locator('.ticket-project-row[data-project-id="b"]')
    const activity = row.locator('.ticket-activity')
    const bars = activity.locator('rect')
    const heights = async () => bars.evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute('height'))))
    await expect(activity.locator('svg')).toHaveAttribute('data-state', 'empty')
    expect(await heights()).toEqual(Array(7).fill(2))
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
    expect(await heights()).toEqual([2, 2, 2, 2, 2, 2, 24])
    await summary.click()
    await expect(activity.getByText('1 recorded ticket change', { exact: true })).toBeVisible()
    await expect(page).toHaveURL('/tickets')
  })
}

test('activity bars plot the seven actual daily counts with one scale across projects', async ({ page }) => {
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
  const bars = (activity: typeof alpha) => activity.locator('rect').evaluateAll((nodes) => nodes.map((node) =>
    ({ x: Number(node.getAttribute('x')), height: Number(node.getAttribute('height')), zero: node.hasAttribute('data-zero') })))
  const alphaBars = await bars(alpha)
  expect(alphaBars.map(bar => bar.height)).toEqual([2, 12, 24, 6, 2, 18, 12])
  expect(alphaBars.map(bar => bar.zero)).toEqual([true, false, false, false, true, false, false])
  expect(alphaBars.map(bar => bar.x)).toEqual([0, 15.33, 30.67, 46, 61.33, 76.67, 92])
  expect((await bars(beta)).map(bar => bar.height)).toEqual([2, 6, 2, 2, 12, 2, 2])
  await alpha.locator('summary').click()
  await expect(alpha.locator('li span')).toHaveText(['0', '2', '4', '1', '0', '3', '2'])
  await expect(alpha.locator('time').last()).toHaveAttribute('datetime', '2026-09-27')
})
