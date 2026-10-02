import { expect, test } from '@playwright/test'
import { boards, openList, projects } from './support/ticket-list'
import { activityDay, ACTIVITY_TIME_ZONE } from '../src/data/board-activity'

for (const width of [390, 1440]) {
  test(`activity sits above tickets without the status chart at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await openList(page, { projects, boards: { ...boards, a: { ...boards.a,
      activity: { timeZone: ACTIVITY_TIME_ZONE, throughDay: activityDay(), counts: [0, 0, 0, 0, 0, 0, 1] },
    } } })
    await expect(page.getByRole('list', { name: 'Task status colors' })).toHaveCount(0)
    await expect(page.locator('.ticket-project-counts, .ticket-status-bar')).toHaveCount(0)
    const row = page.locator('.ticket-project-row[data-project-id="a"]')
    const activity = row.locator('.ticket-project-activity')
    const tickets = row.getByRole('list', { name: 'Active tickets for Alpha project' })
    const activityBox = (await activity.boundingBox())!
    const ticketBox = (await tickets.boundingBox())!
    expect(activityBox.y + activityBox.height).toBeLessThanOrEqual(ticketBox.y)
    await expect(tickets.getByRole('button')).toHaveCount(3)
    await expect(row.getByLabel('Active ticket count for Alpha project')).toHaveText('3 active tickets')
    await expect(tickets.getByRole('button', { name: 'Build release, In Progress' })).toBeVisible()
    await expect(tickets.getByRole('button', { name: 'Duplicate title, In Review' }).first()).toBeVisible()
    const colors = await row.evaluate((node) => ({
      panel: getComputedStyle(node.closest('.ticket-list-content')!).backgroundColor,
      card: getComputedStyle(node.querySelector('.ticket-active-open')!).backgroundColor,
      graph: getComputedStyle(node.querySelector('.ticket-activity-sparkline')!).color,
    }))
    expect(colors).toEqual({ panel: 'rgb(241, 242, 244)', card: 'rgb(255, 255, 255)', graph: 'rgb(11, 74, 111)' })
    await activity.locator('summary').focus()
    await page.keyboard.press('Enter')
    await expect(activity.locator('.ticket-activity-breakdown')).toBeVisible()
    await expect(page).toHaveURL('/tickets')
    await page.keyboard.press('Escape')
    expect(await page.locator('.ticket-list-area').evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true)
  })
}
