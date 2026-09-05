import { expect, test } from '@playwright/test'
import { column, openBoard } from './support/board-fixtures'

test('retains an inline card draft read-only when its column is deleted remotely', async ({ page }) => {
  await openBoard(page)
  const backlog = column(page, 'Backlog')
  await backlog.getByRole('button', { name: '+ Add a card', exact: true }).click()
  await backlog.getByRole('textbox', { name: 'Card title' }).fill('Keep this unfinished task')
  await page.evaluate(() => {
    const boards = JSON.parse(localStorage.getItem('lean-canvas:boards:v1')!)
    const board = Object.values(boards)[0] as { columns: { id: string }[] }
    board.columns = board.columns.filter((item) => item.id !== 'backlog')
    localStorage.setItem('lean-canvas:boards:v1', JSON.stringify(boards))
    window.dispatchEvent(new Event('lean-canvas-board-change'))
  })
  const draft = backlog.getByRole('textbox', { name: 'Card title' })
  await expect(draft).toHaveValue('Keep this unfinished task')
  await expect(draft).toHaveAttribute('readonly', '')
  await expect(backlog.getByRole('alert')).toContainText('column was deleted elsewhere')
  await expect(backlog.getByRole('button', { name: 'Add card', exact: true })).toBeDisabled()
  page.once('dialog', (dialog) => dialog.dismiss())
  await backlog.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(draft).toHaveValue('Keep this unfinished task')
  page.once('dialog', (dialog) => dialog.accept())
  await backlog.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(backlog).toHaveCount(0)
  await expect(page.locator('.kanban-column')).toHaveCount(5)
  const stored = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('lean-canvas:boards:v1')!))[0])
  expect(stored).toMatchObject({ columns: expect.not.arrayContaining([expect.objectContaining({ id: 'backlog' })]), cards: [] })
})
