import { expect, test } from '@playwright/test'
import { addBoardCard, openBoard, openBoardCard } from './support/board-fixtures'

test('keeps drafts on failed saves and subscription read errors, then retries without duplicate comments', async ({ page }) => {
  await openBoard(page)
  await addBoardCard(page, 'Recovery card')
  await openBoardCard(page, 'Recovery card')
  const modal = page.getByRole('dialog')
  await modal.getByLabel('Description').fill('Keep my description')
  await modal.getByLabel('New comment').fill('Retry my comment')
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'lean-canvas:boards:v1') throw new Error('Test storage unavailable')
      return original.call(this, key, value)
    }
    Object.assign(window, { restoreBoardStorage: () => { Storage.prototype.setItem = original } })
  })
  await modal.getByRole('button', { name: 'Add comment' }).click()
  await expect(modal.getByRole('alert')).toContainText('Test storage unavailable')
  await expect(modal.getByLabel('New comment')).toHaveValue('Retry my comment')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(modal.getByLabel('Description')).toHaveValue('Keep my description')
  await page.evaluate(() => {
    (window as unknown as { restoreBoardStorage: () => void }).restoreBoardStorage()
    const saved = localStorage.getItem('lean-canvas:boards:v1')!
    localStorage.setItem('lean-canvas:boards:v1', 'invalid json')
    window.dispatchEvent(new Event('lean-canvas-board-change'))
    Object.assign(window, { savedBoard: saved })
  })
  await expect(modal.getByRole('alert')).not.toBeEmpty()
  await expect(modal.getByLabel('Description')).toHaveValue('Keep my description')
  await page.evaluate(() => {
    localStorage.setItem('lean-canvas:boards:v1', (window as unknown as { savedBoard: string }).savedBoard)
    window.dispatchEvent(new Event('lean-canvas-board-change'))
  })
  await expect(modal.getByRole('alert')).toHaveCount(0)
  await modal.getByRole('button', { name: 'Add comment' }).click()
  await expect(modal.getByText('Retry my comment', { exact: true })).toHaveCount(1)
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(modal).toHaveCount(0)
  await openBoardCard(page, 'Recovery card')
  await expect(modal.getByLabel('Description')).toHaveValue('Keep my description')
  await expect(modal.getByText('Retry my comment', { exact: true })).toHaveCount(1)
})

test('does not overwrite an open draft when the persisted card changes in another session', async ({ page }) => {
  await openBoard(page)
  await addBoardCard(page, 'Shared card')
  await openBoardCard(page, 'Shared card')
  await page.getByLabel('Description').fill('Local draft')
  await page.evaluate(() => {
    const boards = JSON.parse(localStorage.getItem('lean-canvas:boards:v1')!)
    const board = Object.values(boards)[0] as { cards: { description: string }[] }
    board.cards[0].description = 'Remote description'
    localStorage.setItem('lean-canvas:boards:v1', JSON.stringify(boards))
    window.dispatchEvent(new Event('lean-canvas-board-change'))
  })
  await expect(page.getByLabel('Description')).toHaveValue('Local draft')
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('changed elsewhere')
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await openBoardCard(page, 'Shared card')
  await expect(page.getByLabel('Description')).toHaveValue('Remote description')
})

for (const field of ['title', 'description']) test(`retains drafts if remote ${field} notification is delayed`, async ({ page }) => {
  await openBoard(page)
  await addBoardCard(page, 'Shared card')
  await openBoardCard(page, 'Shared card')
  await page.getByLabel('Description').fill('Local description')
  await page.evaluate((field) => {
    const boards = JSON.parse(localStorage.getItem('lean-canvas:boards:v1')!)
    const board = Object.values(boards)[0] as { cards: Record<string, string>[] }
    board.cards[0][field] = 'Remote edit'
    localStorage.setItem('lean-canvas:boards:v1', JSON.stringify(boards))
  }, field)
  const modal = page.getByRole('dialog')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(modal.getByRole('alert')).toContainText('changed elsewhere')
  await expect(modal.getByLabel('Description')).toHaveValue('Local description')
  const persisted = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('lean-canvas:boards:v1')!))[0])
  expect(persisted).toMatchObject({ cards: [expect.objectContaining({ [field]: 'Remote edit' })] })
  page.once('dialog', (dialog) => dialog.accept())
  await modal.getByRole('button', { name: 'Close dialog' }).click()
  await openBoardCard(page, field === 'title' ? 'Remote edit' : 'Shared card')
  await expect(modal.getByRole('textbox', { name: field === 'title' ? 'Title' : 'Description', exact: true })).toHaveValue('Remote edit')
})
