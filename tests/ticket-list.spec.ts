import { expect, test } from '@playwright/test'
import { boards, openList, projects } from './support/ticket-list'

test('shows one project list with stars, counts, and seven-day activity, without descriptions', async ({ page }) => {
  await openList(page)
  const list = page.getByRole('list', { name: 'Projects', exact: true })
  await expect(page.getByText(/High Priority|Low Priority|Starred projects are high priority/)).toHaveCount(0)
  await expect(list.getByRole('button', { name: /Open board for/ })).toHaveText(['Alpha project', 'Beta project', 'Empty project'])
  await expect(list.locator('.ticket-project-star')).toHaveCount(1)
  await expect(list.getByText('Prepare the next product release.', { exact: false })).toHaveCount(0)
  await expect(page.getByRole('list', { name: 'Task counts for Alpha project' })).toHaveText('Todo: 0In Progress: 1In Review: 2')
  await expect(page.getByRole('list', { name: 'Task counts for Beta project' })).toHaveText('Todo: 1In Progress: 0In Review: 1')
  await expect(page.getByRole('list', { name: 'Task counts for Empty project' })).toHaveText('Todo: 0In Progress: 0In Review: 0')
  await expect(page.locator('.ticket-project-updated')).toHaveCount(0)
  await expect(page.locator('.ticket-activity-sparkline')).toHaveCount(3)
  await expect(page.getByRole('table')).toHaveCount(0)
  const rows = await page.locator('.ticket-project-header').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON()))
  expect(new Set(rows.map((row) => row.x)).size).toBe(1)
  expect(rows.every((row) => row.height <= 68)).toBe(true)
  expect(rows[2].y).toBeGreaterThanOrEqual(rows[1].bottom)
})

test('preserves sidebar order regardless of stars and responds to reordering', async ({ page }) => {
  await openList(page, { projects: [projects[1], projects[0], projects[2]], boards })
  const names = page.locator('.ticket-project-open')
  await expect(names).toHaveText(['Beta project', 'Alpha project', 'Empty project'])
  await page.locator('.canvas-nav-item').filter({ hasText: 'Alpha project' }).press('Alt+ArrowUp')
  await expect(names).toHaveText(['Alpha project', 'Beta project', 'Empty project'])
})

test('opens boards with keyboard and preserves ticket deep links and history', async ({ page }) => {
  await openList(page)
  const project = page.getByRole('button', { name: 'Open board for Alpha project', exact: true })
  await project.focus()
  await expect(project).toBeFocused()
  expect(await project.evaluate((node) => getComputedStyle(node, '::after').outlineStyle)).toBe('solid')
  await project.press('Enter')
  await expect(page).toHaveURL('/project/a/ticket')
  await page.getByRole('button', { name: 'A backlog', exact: true }).click()
  await expect(page).toHaveURL(/\/project\/a\/ticket\/a-backlog$/)
  await expect(page.getByRole('dialog', { name: 'Card details' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('dialog', { name: 'Card details' })).toBeVisible()
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await page.getByRole('button', { name: 'All tickets', exact: true }).click()
  await expect(page).toHaveURL('/tickets')
  await page.goBack()
  await expect(page).toHaveURL('/project/a/ticket')
})

test('updates the star when favorited and counts after a card is added', async ({ page }) => {
  await openList(page)
  await page.getByRole('button', { name: 'Open board for Beta project', exact: true }).click()
  await page.getByRole('button', { name: 'Favorite canvas', exact: true }).click()
  const todo = page.getByRole('region', { name: 'Todo', exact: true })
  await todo.getByRole('button', { name: 'Add a card', exact: true }).click()
  await page.getByRole('textbox', { name: 'Card title', exact: true }).fill('Another task')
  await page.getByRole('button', { name: 'Add card', exact: true }).click()
  await page.getByRole('button', { name: 'All tickets', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Open board for Beta project' })).toHaveAccessibleDescription('Starred project')
  await expect(page.locator('.ticket-project-row[data-project-id="b"] .ticket-project-star')).toBeVisible()
  await expect(page.getByRole('list', { name: 'Task counts for Beta project' })).toHaveText('Todo: 2In Progress: 0In Review: 1')
})

for (const width of [320, 375, 390]) {
  test(`keeps compact rows without horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await openList(page)
    expect(await page.locator('body').evaluate((node) => node.scrollWidth)).toBeLessThanOrEqual(width)
    const area = page.locator('.ticket-list-area')
    expect(await area.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true)
    await page.getByRole('button', { name: 'Open board for Empty project' }).scrollIntoViewIfNeeded()
    await expect(page.getByRole('button', { name: 'Open board for Empty project' })).toBeInViewport()
    const rows = await page.locator('.ticket-project-header').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect()))
    expect(new Set(rows.map((row) => row.x)).size).toBe(1)
    expect(rows.every((row) => row.height <= 100)).toBe(true)
  })
}

test('wraps long names and omits descriptions on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  const longProject = { ...projects[0], name: 'AProjectNameWithoutSpacesThatMustWrapOnNarrowScreens', notes: 'A long project description. '.repeat(100) }
  await openList(page, { projects: [longProject], boards })
  const button = page.getByRole('button', { name: `Open board for ${longProject.name}` })
  await expect(button).toBeVisible()
  expect(await page.locator('.ticket-list-area').evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true)
  expect((await page.locator('.ticket-project-header').boundingBox())!.height).toBeLessThan(180)
})

test('honors the dirty ticket guard when leaving a project board for the list', async ({ page }) => {
  await openList(page)
  await page.getByRole('button', { name: 'Open board for Alpha project', exact: true }).click()
  await page.getByRole('button', { name: 'Add a card', exact: true }).first().click()
  await page.getByRole('textbox', { name: 'Card title', exact: true }).fill('Keep this draft')
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('button', { name: 'All tickets', exact: true }).click()
  await expect(page).toHaveURL('/project/a/ticket')
  await expect(page.getByRole('textbox', { name: 'Card title', exact: true })).toHaveValue('Keep this draft')
})
