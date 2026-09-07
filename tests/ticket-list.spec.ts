import { expect, test, type Page } from '@playwright/test'
import type { BoardData } from '../src/data/board'
import { canvas } from '../unit/fixtures'

type Card = BoardData['cards'][number]
const card = (id: string, columnId: string, title: string, rank: string): Card => ({ id, columnId, title, description: '', rank })
const projects = [canvas('a'), { ...canvas('b'), name: 'Other', title: 'Other' }]
const boards: Record<string, BoardData> = {
  a: { columns: [{ id: 'backlog', title: 'Backlog' }, { id: 'done', title: 'Done' }], cards: [card('shared-card', 'backlog', 'First project ticket', 'a')], comments: [] },
  b: { columns: [{ id: 'ideas', title: 'Ideas' }, { id: 'shipped', title: 'Shipped' }], cards: [card('shared-card', 'ideas', 'First project ticket', 'b'), card('second-card', 'ideas', 'First in rank', 'a')], comments: [] },
}
async function openList(page: Page) {
  await page.addInitScript(({ projects, boards }) => {
    localStorage.clear()
    localStorage.setItem('lean-canvas:v2', JSON.stringify(projects))
    localStorage.setItem('lean-canvas:boards:v1', JSON.stringify(boards))
  }, { projects, boards })
  await page.goto('/tickets')
  await expect(page.getByRole('main', { name: 'All tickets' })).toBeVisible()
}
test('groups every project by custom status and keeps ticket order and deep-link history', async ({ page }) => {
  await openList(page)
  expect(await page.getByRole('heading', { level: 2 }).allTextContents()).toEqual(['Test canvas', 'Other'])
  await expect(page.getByRole('heading', { name: 'Ideas' })).toBeVisible()
  const ideas = page.locator('.ticket-list-status').filter({ has: page.getByRole('heading', { name: 'Ideas' }) })
  await expect(ideas.locator('.ticket-list-count')).toHaveText('2')
  expect(await page.locator('.ticket-list-project').nth(1).locator('.ticket-list-card-title').allTextContents()).toEqual(['First in rank', 'First project ticket'])
  await expect(page.getByRole('button', { name: 'Open board for Test canvas', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open board for Other', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'First project ticket — Test canvas', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'First project ticket — Other', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'First in rank — Other', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'First project ticket — Other', exact: true }).click()
  await expect(page).toHaveURL(/\/project\/b\/ticket\/shared-card$/)
  await expect(page.getByRole('dialog', { name: 'Card details' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('dialog', { name: 'Card details' })).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL('/tickets')
  await page.goForward()
  await expect(page.getByRole('dialog', { name: 'Card details' })).toBeVisible()
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await expect(page).toHaveURL('/project/b/ticket')
})
test('keeps list rows within a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await openList(page)
  const width = await page.locator('.ticket-list-area').evaluate((node) => node.scrollWidth)
  expect(width).toBeLessThanOrEqual(375)
  await expect(page.getByRole('button', { name: 'First in rank — Other', exact: true })).toHaveCSS('min-height', '44px')
})
test('honors the dirty ticket guard when leaving a project board for the list', async ({ page }) => {
  await openList(page)
  await page.getByRole('button', { name: 'Open board for Test canvas', exact: true }).click()
  await page.getByRole('button', { name: '+ Add a card', exact: true }).first().click()
  await page.getByRole('textbox', { name: 'Card title', exact: true }).fill('Keep this draft')
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.locator('.topbar-all-tickets').click()
  await expect(page).toHaveURL('/project/a/ticket')
  await expect(page.getByRole('textbox', { name: 'Card title', exact: true })).toHaveValue('Keep this draft')
})
