import { expect, test } from '@playwright/test'
import { addBoardCard, column, openBoard, openBoardCard } from './support/board-fixtures'

for (const kind of ['card', 'column'] as const) test(`inline ${kind} restores its trigger after save and Escape`, async ({ page }) => {
  await openBoard(page)
  const trigger = kind === 'card' ? column(page, 'Backlog').getByRole('button', { name: '+ Add a card' }) :
    page.getByRole('button', { name: '+ Add another column' })
  await trigger.click()
  await page.getByLabel(`${kind === 'card' ? 'Card' : 'Column'} title`).press('Escape')
  await expect(trigger).toBeFocused()
  await trigger.click()
  await page.getByLabel(`${kind === 'card' ? 'Card' : 'Column'} title`).fill('Keyboard continuation')
  await page.getByRole('button', { name: `Add ${kind}`, exact: true }).click()
  await expect(trigger).toBeFocused()
})

test('remote column deletion retains a read-only rename draft and restores the board tab', async ({ page }) => {
  await openBoard(page)
  await column(page, 'Backlog').getByRole('button', { name: 'Column actions for Backlog' }).click()
  await page.getByRole('button', { name: 'Rename column', exact: true }).click()
  const modal = page.getByRole('dialog')
  await modal.getByLabel('Title', { exact: true }).fill('Keep my rename')
  await page.evaluate(() => {
    const boards = JSON.parse(localStorage.getItem('lean-canvas:boards:v1')!)
    const board = Object.values(boards)[0] as { columns: { id: string }[] }
    board.columns = board.columns.filter(({ id }) => id !== 'backlog')
    localStorage.setItem('lean-canvas:boards:v1', JSON.stringify(boards))
    window.dispatchEvent(new Event('lean-canvas-board-change'))
  })
  await expect(modal.getByLabel('Title', { exact: true })).toHaveAttribute('readonly', '')
  await expect(modal.getByRole('alert')).toContainText('column was deleted elsewhere')
  await expect(modal.getByRole('button', { name: 'Save', exact: true })).toBeDisabled()
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.keyboard.press('Escape')
  await expect(modal.getByLabel('Title', { exact: true })).toHaveValue('Keep my rename')
  page.once('dialog', (dialog) => dialog.accept())
  await modal.getByRole('button', { name: 'Close dialog' }).click()
  await expect(page.getByRole('tab', { name: 'Board', exact: true })).toBeFocused()
})

test('remote card deletion retains both drafts and restores focus after its trigger is removed', async ({ page }) => {
  await openBoard(page)
  await addBoardCard(page, 'Removed card')
  await openBoardCard(page, 'Removed card')
  const modal = page.getByRole('dialog')
  await modal.getByLabel('Description').fill('Keep description')
  await modal.getByLabel('New comment').fill('Keep comment')
  await page.evaluate(() => {
    const boards = JSON.parse(localStorage.getItem('lean-canvas:boards:v1')!)
    const board = Object.values(boards)[0] as { cards: unknown[]; comments: unknown[] }
    board.cards = []; board.comments = []
    localStorage.setItem('lean-canvas:boards:v1', JSON.stringify(boards))
    window.dispatchEvent(new Event('lean-canvas-board-change'))
  })
  await expect(modal.getByRole('alert')).toContainText('card was deleted elsewhere')
  await expect(modal.getByLabel('Description')).toHaveAttribute('readonly', '')
  await expect(modal.getByLabel('New comment')).toHaveValue('Keep comment')
  for (const name of ['Save', 'Add comment', 'Delete card']) await expect(modal.getByRole('button', { name, exact: true })).toBeDisabled()
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.keyboard.press('Escape')
  await expect(modal.getByLabel('Description')).toHaveValue('Keep description')
  page.once('dialog', (dialog) => dialog.accept())
  await page.keyboard.press('Escape')
  await expect(page.getByRole('tab', { name: 'Board', exact: true })).toBeFocused()
})
