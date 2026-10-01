import { expect, test } from '@playwright/test'
import { openList } from './support/ticket-list'

for (const width of [320, 1428]) {
  test(`vertical status bars reflect counts alongside an activity sparkline at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 801 })
    await openList(page)
    const counts = page.getByRole('list', { name: 'Task counts for Alpha project' })
    const bars = counts.locator('.ticket-status-bar')
    await expect(bars).toHaveCount(3)
    for (const [index, color] of ['rgb(247, 205, 209)', 'rgb(204, 224, 255)', 'rgb(255, 237, 171)'].entries()) {
      await expect(bars.nth(index)).toHaveCSS('background-color', color)
      await expect(counts.locator('.ticket-status-track').nth(index)).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    }
    const ratios = await bars.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height / node.parentElement!.getBoundingClientRect().height))
    for (const [index, expected] of [0, 0.5, 1].entries()) expect(ratios[index]).toBeCloseTo(expected, 2)
    const betaBars = page.getByRole('list', { name: 'Task counts for Beta project' }).locator('.ticket-status-bar')
    await expect(bars.nth(1)).toHaveCSS('height', '12px')
    await expect(betaBars.nth(0)).toHaveCSS('height', '12px')
    await expect(betaBars.nth(2)).toHaveCSS('height', '12px')
    const bottoms = await bars.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().bottom))
    expect(new Set(bottoms).size).toBe(1)
    const tracks = await counts.locator('.ticket-status-track').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()))
    expect(tracks.every(track => track.width === 24 && track.height === 24)).toBe(true)
    expect(tracks[0].right).toBe(tracks[1].left)
    expect(tracks[1].right).toBe(tracks[2].left)
    await expect(counts.locator('.ticket-status-value:visible')).toHaveCount(0)
    const backlog = counts.getByRole('button', { name: 'In Progress: 1', exact: true })
    await backlog.hover()
    await expect(counts.getByText('In Progress: 1', { exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(counts.locator('.ticket-status-value:visible')).toHaveCount(0)
    await backlog.focus()
    await expect(counts.getByText('In Progress: 1', { exact: true })).toBeVisible()
    await backlog.press('Escape')
    await expect(backlog).toBeFocused()
    await expect(counts.locator('.ticket-status-value:visible')).toHaveCount(0)
    await backlog.click()
    await expect(counts.getByText('In Progress: 1', { exact: true })).toBeVisible()
    await expect(page).toHaveURL('/tickets')
    const empty = page.getByRole('list', { name: 'Task counts for Empty project' })
    for (const bar of await empty.locator('.ticket-status-bar').all()) await expect(bar).toHaveCSS('height', '0px')
    await expect(empty.locator('[data-zero]')).toHaveCount(3)
    const baselines = await empty.locator('.ticket-status-track').evaluateAll(nodes => nodes.map(node => {
      const marker = getComputedStyle(node, '::after')
      return { content: marker.content, height: marker.height, color: marker.backgroundColor }
    }))
    expect(baselines.every(marker => marker.content === '""' && marker.height === '1px' && marker.color !== 'rgba(0, 0, 0, 0)')).toBe(true)
    await empty.getByRole('button', { name: 'Todo: 0', exact: true }).hover()
    await expect(empty.getByText('Todo: 0', { exact: true })).toBeVisible()
    await expect(page).toHaveURL('/tickets')
    const sparkline = page.locator('.ticket-project-row[data-project-id="a"] .ticket-activity-sparkline')
    await expect(sparkline).toBeVisible()
    expect((await sparkline.locator('polyline').getAttribute('points'))!.split(' ')).toHaveLength(7)
  })
}

test('rescales every project together when another project exceeds the current maximum', async ({ page }) => {
  await openList(page)
  await page.getByRole('button', { name: 'Open board for Beta project', exact: true }).click()
  const todo = page.getByRole('region', { name: 'Todo', exact: true })
  for (const title of ['New task one', 'New task two']) {
    await todo.getByRole('button', { name: 'Add a card' }).click()
    await page.getByRole('textbox', { name: 'Card title', exact: true }).fill(title)
    await page.getByRole('button', { name: 'Add card', exact: true }).click()
  }
  await page.getByRole('button', { name: 'All tickets', exact: true }).click()
  const alphaBars = page.getByRole('list', { name: 'Task counts for Alpha project' }).locator('.ticket-status-bar')
  const betaBars = page.getByRole('list', { name: 'Task counts for Beta project' }).locator('.ticket-status-bar')
  await expect(alphaBars.nth(1)).toHaveCSS('height', '8px')
  await expect(alphaBars.nth(2)).toHaveCSS('height', '16px')
  await expect(betaBars.nth(0)).toHaveCSS('height', '24px')
  await expect(betaBars.nth(2)).toHaveCSS('height', '8px')
})
