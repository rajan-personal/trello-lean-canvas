import { expect, test } from '@playwright/test'
import { addBoardCard, openBoard, openBoardCard } from './support/board-fixtures'

test('the existing Kanban composer creates children at each level and never leaks them into the root board', async ({ page }) => {
  await openBoard(page)
  await addBoardCard(page, 'Parent')
  await openBoardCard(page, 'Parent')
  await page.getByRole('button', { name: 'Open board', exact: true }).click()
  await expect(page.locator('.kanban-card')).toHaveCount(0)
  await addBoardCard(page, 'Child')
  await openBoardCard(page, 'Child')
  await page.getByRole('button', { name: 'Open board', exact: true }).click()
  await expect(page.locator('.kanban-card')).toHaveCount(0)
  await addBoardCard(page, 'Grandchild')
  await page.reload()
  await expect(page.locator('.kanban-card')).toHaveText('Grandchild')
  await page.getByRole('navigation', { name: 'Ticket hierarchy' }).getByRole('button', { name: 'Project board', exact: true }).click()
  await expect(page.locator('.kanban-card')).toHaveCount(1)
  await expect(page.locator('.kanban-card')).toHaveAccessibleName('Parent')
  await expect(page.locator('.kanban-card')).toHaveAccessibleDescription('0/1 child tickets done.')
})
