import { expect, test, type Page } from '@playwright/test'
import type { BoardData } from '../src/data/board'
import { canvas } from '../unit/fixtures'

type Card = BoardData['cards'][number]
const card = (id: string, columnId: string, title: string, rank: string): Card => ({ id, columnId, title, description: '', rank })
const projects = [{ ...canvas('a'), name: 'Alpha project', title: 'Alpha project' }, { ...canvas('b'), name: 'Beta project', title: 'Beta project' }]
const boards: Record<string, BoardData> = {
  a: { columns: [{ id: 'z-custom', title: 'Review' }, { id: 'a-custom', title: 'Backlog' }], cards: [
    { ...card('a-duplicate-late', 'z-custom', 'Duplicate title', 'b'), storyPoints: 13 }, { ...card('a-duplicate-first', 'z-custom', 'Duplicate title', 'a'), storyPoints: 3 }, card('a-backlog', 'a-custom', 'A backlog', 'a'),
  ], comments: [] },
  b: { columns: [{ id: 'b-custom', title: 'Done' }, { id: 'c-custom', title: 'Review' }], cards: [card('b-done', 'b-custom', 'B done', 'a'), card('b-duplicate', 'c-custom', 'Duplicate title', 'a')], comments: [] },
}
async function openList(page: Page) {
  await page.addInitScript(({ projects, boards }) => { localStorage.clear(); localStorage.setItem('lean-canvas:v2', JSON.stringify(projects)); localStorage.setItem('lean-canvas:boards:v1', JSON.stringify(boards)) }, { projects, boards })
  await page.goto('/tickets'); await expect(page.getByRole('main', { name: 'All tickets' })).toBeVisible(); await expect(page.getByRole('table')).toBeVisible()
}
const ticketRows = (page: Page) => page.locator('.ticket-list-ticket-row')
test('renders one flat table and sorts every project by Project and custom Status in both directions', async ({ page }) => {
  await openList(page)
  expect(await page.locator('.ticket-list-project, .ticket-list-status').count()).toBe(0)
  expect(await ticketRows(page).count()).toBe(5)
  expect(await page.locator('.ticket-list-project-cell').allTextContents()).toEqual(['Alpha project', 'Alpha project', 'Alpha project', 'Beta project', 'Beta project'])
  expect(await page.locator('.ticket-list-ticket-title').allTextContents()).toEqual(['Duplicate title', 'Duplicate title', 'A backlog', 'B done', 'Duplicate title'])
  expect(await page.locator('.ticket-list-points-cell').allTextContents()).toEqual(['3', '13+', '—', '—', '—'])
  const table = page.getByRole('table'); const projectHeader = table.getByRole('columnheader', { name: /Project/ }); const statusHeader = table.getByRole('columnheader', { name: /Status/ })
  await expect(projectHeader).toHaveAttribute('aria-sort', 'ascending'); await expect(statusHeader).toHaveAttribute('aria-sort', 'none')
  const projectSort = page.getByRole('button', { name: /Sort by Project/ }); await projectSort.focus(); await expect(projectSort).toBeFocused(); await page.keyboard.press('Enter')
  await expect(projectHeader).toHaveAttribute('aria-sort', 'descending')
  expect(await page.locator('.ticket-list-project-cell').allTextContents()).toEqual(['Beta project', 'Beta project', 'Alpha project', 'Alpha project', 'Alpha project'])
  await projectSort.click(); await expect(projectHeader).toHaveAttribute('aria-sort', 'ascending')
  expect(await page.locator('.ticket-list-project-cell').allTextContents()).toEqual(['Alpha project', 'Alpha project', 'Alpha project', 'Beta project', 'Beta project'])
  const statusSort = page.getByRole('button', { name: /Sort by Status/ }); await statusSort.click(); await expect(statusHeader).toHaveAttribute('aria-sort', 'ascending'); await expect(projectHeader).toHaveAttribute('aria-sort', 'none')
  expect(await page.locator('.ticket-list-status-cell').allTextContents()).toEqual(['Backlog', 'Done', 'Review', 'Review', 'Review'])
  expect(await ticketRows(page).evaluateAll((rows) => rows.map((row) => row.getAttribute('data-ticket-id')))).toEqual(['a-backlog', 'b-done', 'a-duplicate-first', 'a-duplicate-late', 'b-duplicate'])
  await statusSort.click(); await expect(statusHeader).toHaveAttribute('aria-sort', 'descending')
  expect(await page.locator('.ticket-list-status-cell').allTextContents()).toEqual(['Review', 'Review', 'Review', 'Done', 'Backlog'])
  expect(await ticketRows(page).evaluateAll((rows) => rows.map((row) => row.getAttribute('data-ticket-id')))).toEqual(['a-duplicate-first', 'a-duplicate-late', 'b-duplicate', 'b-done', 'a-backlog'])
})
test('keeps ticket deep links, project-board access, and history behavior', async ({ page }) => {
  await openList(page); await page.getByRole('button', { name: 'Open board for Alpha project', exact: true }).click(); await expect(page).toHaveURL('/project/a/ticket')
  await page.locator('.topbar-all-tickets').click(); await expect(page).toHaveURL('/tickets'); await page.locator('.ticket-list-ticket-row[data-ticket-id="a-duplicate-first"] .ticket-list-ticket-button').click()
  await expect(page).toHaveURL(/\/project\/a\/ticket\/a-duplicate-first$/); await expect(page.getByRole('dialog', { name: 'Card details' })).toBeVisible(); await page.reload(); await expect(page.getByRole('dialog', { name: 'Card details' })).toBeVisible()
  await page.goBack(); await expect(page).toHaveURL('/tickets'); await page.goForward(); await expect(page.getByRole('dialog', { name: 'Card details' })).toBeVisible(); await page.getByRole('button', { name: 'Close dialog' }).click(); await expect(page).toHaveURL('/project/a/ticket')
})
test('keeps list rows within a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 }); await openList(page); const width = await page.locator('.ticket-list-area').evaluate((node) => node.scrollWidth)
  expect(width).toBeLessThanOrEqual(375); await expect(page.getByRole('button', { name: /Duplicate title/ }).first()).toHaveCSS('min-height', '44px'); await expect(page.getByRole('table')).toBeVisible()
})
test('honors the dirty ticket guard when leaving a project board for the list', async ({ page }) => {
  await openList(page); await page.getByRole('button', { name: 'Open board for Alpha project', exact: true }).click(); await page.getByRole('button', { name: '+ Add a card', exact: true }).first().click(); await page.getByRole('textbox', { name: 'Card title', exact: true }).fill('Keep this draft')
  page.once('dialog', (dialog) => dialog.dismiss()); await page.locator('.topbar-all-tickets').click(); await expect(page).toHaveURL('/project/a/ticket'); await expect(page.getByRole('textbox', { name: 'Card title', exact: true })).toHaveValue('Keep this draft')
})
