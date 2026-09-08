import { expect, test, type Page } from '@playwright/test'
import type { BoardData } from '../src/data/board'
import { canvas } from '../unit/fixtures'
type Card = BoardData['cards'][number]
const card = (id: string, columnId: string, title: string, rank: string): Card => ({ id, columnId, title, description: '', rank })
const projects = [{ ...canvas('a'), name: 'Alpha project', title: 'Alpha project' }, { ...canvas('b'), name: 'Beta project', title: 'Beta project' }, { ...canvas('c'), name: 'Empty project', title: 'Empty project' }]
const boards: Record<string, BoardData> = {
  a: { columns: [{ id: 'z-custom', title: 'Review' }, { id: 'a-custom', title: 'Backlog' }], cards: [
    { ...card('a-duplicate-late', 'z-custom', 'Duplicate title', 'b'), storyPoints: 13 }, { ...card('a-duplicate-first', 'z-custom', 'Duplicate title', 'a'), storyPoints: 3 }, card('a-backlog', 'a-custom', 'A backlog', 'a'),
  ], comments: [] },
  b: { columns: [{ id: 'b-custom', title: 'Done' }, { id: 'c-custom', title: 'Review' }], cards: [card('b-done', 'b-custom', 'B done', 'a'), card('b-duplicate', 'c-custom', 'Duplicate title', 'a')], comments: [] },
  c: { columns: [], cards: [], comments: [] },
}
const longProjects = [{ ...canvas('long'), name: 'A project name that wraps across the narrow list without losing data', title: 'A project name that wraps across the narrow list without losing data' }]
const longBoards: Record<string, BoardData> = { long: {
  columns: [{ id: 'long-status', title: 'Waiting for customer validation and stakeholder review' }], cards: [{ ...card('long-ticket', 'long-status', 'UnbrokenTicketTitleThatMustRemainReachableOnNarrowScreens', 'a'), storyPoints: 8 }], comments: [],
} }
async function openList(page: Page, seed = { projects, boards }) {
  await page.addInitScript(({ projects, boards }) => { localStorage.clear(); localStorage.setItem('lean-canvas:v2', JSON.stringify(projects)); localStorage.setItem('lean-canvas:boards:v1', JSON.stringify(boards)) }, seed)
  await page.goto('/tickets'); await expect(page.getByRole('main', { name: 'All tickets' })).toBeVisible(); await expect(page.getByRole('table')).toBeVisible()
}
const ticketRows = (page: Page) => page.locator('.ticket-list-ticket-row')
test('groups tickets by project and sorts status by each board workflow', async ({ page }) => {
  await openList(page)
  expect(await ticketRows(page).count()).toBe(5)
  expect(await page.locator('.ticket-list-project-row .ticket-list-project-button').allTextContents()).toEqual(['Alpha project', 'Beta project'])
  expect(await page.locator('.ticket-list-ticket-title').allTextContents()).toEqual(['Duplicate title', 'Duplicate title', 'A backlog', 'B done', 'Duplicate title']); await expect(page.locator('.ticket-list-ticket-title').first()).toHaveCSS('font-weight', '400')
  expect(await page.locator('.ticket-list-points-cell').allTextContents()).toEqual(['3', '13+', '—', '—', '—'])
  const table = page.getByRole('table'); const ticketHeader = table.getByRole('columnheader', { name: /Ticket/ }); const projectHeader = table.getByRole('columnheader', { name: /Project/ }); const statusHeader = table.getByRole('columnheader', { name: /Status/ })
  expect((await ticketHeader.boundingBox())!.width).toBeGreaterThan((await statusHeader.boundingBox())!.width * 4)
  await expect(projectHeader).not.toHaveAttribute('aria-sort'); await expect(statusHeader).toHaveAttribute('aria-sort', 'none'); await expect(projectHeader.getByText('Project', { exact: true })).toHaveClass('ticket-list-visually-hidden')
  await expect(page.getByRole('button', { name: /Sort Project|Filter Project/ })).toHaveCount(0)
  const statusSort = page.getByRole('button', { name: /Sort Status/ }); await statusSort.focus(); await expect(statusSort).toBeFocused(); await page.keyboard.press('Enter')
  await expect(statusHeader).toHaveAttribute('aria-sort', 'ascending')
  expect(await page.locator('.ticket-list-status-cell').allTextContents()).toEqual(['Review', 'Review', 'Backlog', 'Done', 'Review'])
  expect(await ticketRows(page).evaluateAll((rows) => rows.map((row) => row.getAttribute('data-ticket-id')))).toEqual(['a-duplicate-first', 'a-duplicate-late', 'a-backlog', 'b-done', 'b-duplicate'])
  await statusSort.click(); await expect(statusHeader).toHaveAttribute('aria-sort', 'descending')
  expect(await page.locator('.ticket-list-status-cell').allTextContents()).toEqual(['Backlog', 'Review', 'Review', 'Review', 'Done'])
  expect(await ticketRows(page).evaluateAll((rows) => rows.map((row) => row.getAttribute('data-ticket-id')))).toEqual(['a-backlog', 'a-duplicate-first', 'a-duplicate-late', 'b-duplicate', 'b-done'])
})
test('tracks sidebar order through status controls and project reordering', async ({ page }) => {
  await openList(page, { projects: [projects[1], projects[0], projects[2]], boards })
  const groupNames = page.locator('.ticket-list-project-row .ticket-list-project-button')
  await expect(groupNames).toHaveText(['Beta project', 'Alpha project'])
  await expect(page.locator('.canvas-nav-label')).toHaveText(['Beta project', 'Alpha project', 'Empty project'])
  const statusSort = page.getByRole('button', { name: /Sort Status/ }); await statusSort.click(); await statusSort.click(); await expect(groupNames).toHaveText(['Beta project', 'Alpha project'])
  await page.getByRole('button', { name: /Filter Status/ }).click(); await page.getByRole('checkbox', { name: 'Review' }).uncheck(); await expect(groupNames).toHaveText(['Beta project', 'Alpha project'])
  await page.keyboard.press('Escape'); await page.locator('.canvas-nav-item').filter({ hasText: 'Alpha project' }).press('Alt+ArrowUp')
  await expect(page.locator('.canvas-nav-label')).toHaveText(['Alpha project', 'Beta project', 'Empty project']); await expect(groupNames).toHaveText(['Alpha project', 'Beta project'])
})
test('fills the available height, removes project tags, and filters from column menus', async ({ page }) => {
  await openList(page)
  await expect(page.getByRole('navigation', { name: 'Project boards' })).toHaveCount(0)
  await expect(page.locator('.ticket-list-project-boards, .ticket-list-board-link')).toHaveCount(0)
  await expect(page.getByText('No tickets in this project yet.')).toHaveCount(0); await expect(page.getByRole('table').getByText('Empty project')).toHaveCount(0)
  await expect(page.getByRole('main', { name: 'All tickets' })).toBeVisible()
  await expect(page.getByRole('table', { name: 'Tickets grouped by project' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: /Ticket/ })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: /Project/ })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: /Status/ })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: /Story points/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Filter Project/ })).toHaveCount(0)
  const statusMenu = page.getByRole('button', { name: /Filter Status/ })
  await statusMenu.click(); await page.getByRole('checkbox', { name: 'Review' }).uncheck()
  expect(await page.locator('.ticket-list-status-cell').allTextContents()).toEqual(['Backlog', 'Done'])
  await expect(statusMenu).toHaveAccessibleName(/filter applied/)
  await page.getByRole('button', { name: 'Clear filter' }).click(); expect(await ticketRows(page).count()).toBe(5)
  await page.keyboard.press('Escape'); await expect(page.getByRole('group', { name: 'Filter Status' })).toHaveCount(0); await expect(statusMenu).toBeFocused()
  await statusMenu.click(); await page.getByRole('checkbox', { name: 'Review' }).uncheck()
  await page.getByRole('checkbox', { name: 'Backlog' }).uncheck(); await page.getByRole('searchbox', { name: 'Search Status values' }).fill('done')
  await expect(page.getByRole('checkbox', { name: 'Done' })).toBeVisible(); await expect(page.getByRole('checkbox', { name: 'Backlog' })).toHaveCount(0)
  await page.getByRole('checkbox', { name: 'Done' }).uncheck(); await expect(page.getByText('No tickets match the selected filters.')).toBeVisible(); await openList(page, { projects: [projects[2]], boards: { c: boards.c } }); expect(await ticketRows(page).count()).toBe(0); const area = await page.locator('.ticket-list-area').boundingBox(); const shell = await page.locator('.ticket-list-table-shell').boundingBox(); expect(shell!.height).toBeGreaterThan(area!.height - 60)
})
test('keeps ticket deep links, project-board access, and history behavior', async ({ page }) => {
  await openList(page); await page.getByRole('button', { name: 'Open board for Alpha project', exact: true }).first().click(); await expect(page).toHaveURL('/project/a/ticket')
  await page.locator('.topbar-all-tickets').click(); await expect(page).toHaveURL('/tickets'); await page.locator('.ticket-list-ticket-row[data-ticket-id="a-duplicate-first"] .ticket-list-ticket-button').click()
  await expect(page).toHaveURL(/\/project\/a\/ticket\/a-duplicate-first$/); await expect(page.getByRole('dialog', { name: 'Card details' })).toBeVisible(); await page.reload(); await expect(page.getByRole('dialog', { name: 'Card details' })).toBeVisible()
  await page.goBack(); await expect(page).toHaveURL('/tickets'); await page.goForward(); await expect(page.getByRole('dialog', { name: 'Card details' })).toBeVisible(); await page.getByRole('button', { name: 'Close dialog' }).click(); await expect(page).toHaveURL('/project/a/ticket')
})
test('keeps horizontal table scrolling inside 320, 375, and 390px viewports', async ({ page }) => {
  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 800 }); await openList(page)
    expect(await page.locator('body').evaluate((node) => node.scrollWidth)).toBeLessThanOrEqual(width)
    const shell = page.locator('.ticket-list-table-shell'); const sizes = await shell.evaluate((node) => ({ client: node.clientWidth, scroll: node.scrollWidth }))
    expect(sizes.scroll).toBeGreaterThan(sizes.client); await expect(page.getByRole('button', { name: /Duplicate title/ }).first()).toHaveCSS('min-height', '44px')
    await expect(page.getByRole('table')).toBeVisible()
  }
})
test('wraps long ticket, project, and status data without dropping it on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 }); await openList(page, { projects: longProjects, boards: longBoards })
  await expect(page.getByText('UnbrokenTicketTitleThatMustRemainReachableOnNarrowScreens')).toBeVisible()
  await expect(page.getByText('A project name that wraps across the narrow list without losing data').first()).toBeVisible()
  await expect(page.getByText('Waiting for customer validation and stakeholder review')).toBeVisible()
  await expect(page.getByText('8')).toBeVisible()
  const board = page.getByRole('button', { name: /Open board for A project name/ }); await board.focus(); await expect(board).toBeFocused(); await expect(board).toHaveCSS('outline-style', 'solid')
  const ticket = page.getByRole('button', { name: /UnbrokenTicketTitle/ }); await ticket.focus(); await expect(ticket).toBeFocused(); await expect(ticket).toHaveCSS('outline-style', 'solid')
})
test('honors the dirty ticket guard when leaving a project board for the list', async ({ page }) => {
  await openList(page); await page.getByRole('button', { name: 'Open board for Alpha project', exact: true }).first().click(); await page.getByRole('button', { name: '+ Add a card', exact: true }).first().click(); await page.getByRole('textbox', { name: 'Card title', exact: true }).fill('Keep this draft')
  page.once('dialog', (dialog) => dialog.dismiss()); await page.locator('.topbar-all-tickets').click(); await expect(page).toHaveURL('/project/a/ticket'); await expect(page.getByRole('textbox', { name: 'Card title', exact: true })).toHaveValue('Keep this draft') })
