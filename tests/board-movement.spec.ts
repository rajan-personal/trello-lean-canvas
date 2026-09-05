import { expect, test } from '@playwright/test'
import { addBoardCard, column, openBoard, openBoardCard } from './support/board-fixtures'

test('moves cards by drag within and across columns, preserving stable IDs and reload order', async ({ page }) => {
  await openBoard(page)
  for (const title of ['Alpha', 'Beta', 'Gamma']) await addBoardCard(page, title)
  const ids = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('lean-canvas:boards:v1')!))
    .flatMap((board) => (board as { cards: { id: string }[] }).cards.map((card) => card.id)).sort())
  const backlog = column(page, 'Backlog')
  await backlog.getByRole('button', { name: 'Gamma', exact: true }).dragTo(
    backlog.getByRole('button', { name: 'Alpha', exact: true }), { targetPosition: { x: 20, y: 3 } })
  await expect(backlog.locator('.kanban-card')).toHaveText(['Gamma', 'Alpha', 'Beta'])
  const gamma = backlog.getByRole('button', { name: 'Gamma', exact: true })
  const gammaBox = (await gamma.boundingBox())!
  await backlog.getByRole('button', { name: 'Beta', exact: true }).dragTo(gamma,
    { targetPosition: { x: 20, y: gammaBox.height - 3 } })
  await expect(backlog.locator('.kanban-card')).toHaveText(['Gamma', 'Beta', 'Alpha'])
  await backlog.getByRole('button', { name: 'Alpha', exact: true }).dragTo(column(page, 'Todo'))
  await expect(column(page, 'Todo').locator('.kanban-card')).toHaveText(['Alpha'])
  await page.reload()
  await page.getByRole('tab', { name: 'Board', exact: true }).click()
  await expect(backlog.locator('.kanban-card')).toHaveText(['Gamma', 'Beta'])
  await expect(column(page, 'Todo').locator('.kanban-card')).toHaveText(['Alpha'])
  expect(await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('lean-canvas:boards:v1')!))
    .flatMap((board) => (board as { cards: { id: string }[] }).cards.map((card) => card.id)).sort())).toEqual(ids)
})

test('mobile card details omit movement controls and preserve the column when saving', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await openBoard(page)
  await addBoardCard(page, 'First')
  await openBoardCard(page, 'First')
  const modal = page.getByRole('dialog')
  await expect(modal.getByRole('combobox')).toHaveCount(0)
  await expect(modal.getByText('Move card', { exact: true })).toHaveCount(0)
  await modal.getByLabel('Description').fill('Details only; drag the card to move it.')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(column(page, 'Backlog').locator('.kanban-card')).toHaveText(['First'])
  await expect(page.locator('.kanban-card > *')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375)
})
