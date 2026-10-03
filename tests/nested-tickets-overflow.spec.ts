import { expect, test } from '@playwright/test'
import { addBoardCard, openBoard, openBoardCard } from './support/board-fixtures'

for (const [label, columnTitle] of [
  ['long status', 'Waiting for customer acceptance and compliance approval'],
  ['unbroken status', 'X'.repeat(500)],
]) test(`child list fits mobile: ${label}`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openBoard(page)
  await addBoardCard(page, 'Parent')
  await openBoardCard(page, 'Parent')
  const children = page.getByRole('region', { name: /^Subtasks/ })
  await children.getByRole('button', { name: 'Add ticket', exact: true }).click()
  await children.getByLabel('Ticket title').fill('Child')
  await children.getByLabel('Ticket title').press('Enter')
  await expect(children.getByRole('button', { name: 'Child Backlog', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await page.getByRole('button', { name: 'Column actions for Backlog' }).click()
  await page.getByRole('button', { name: 'Rename column', exact: true }).click()
  await page.getByLabel('Title', { exact: true }).fill(columnTitle)
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await openBoardCard(page, 'Parent')
  const dimensions = await page.getByRole('dialog').evaluate((el) => ({ client: el.clientWidth, scroll: el.scrollWidth }))
  expect(dimensions.scroll).toBe(dimensions.client)
})
