import { expect, type Page } from '@playwright/test'
import { openSampleCanvas } from './canvas-fixtures'

export async function openBoard(page: Page) {
  await openSampleCanvas(page)
  await page.getByRole('tab', { name: 'Board', exact: true }).click()
  await expect(page.locator('.kanban-column')).toHaveCount(6)
}
export const column = (page: Page, name: string) => page.getByRole('region', { name, exact: true })
export async function addBoardCard(page: Page, title: string, list = 'Backlog') {
  await column(page, list).getByRole('button', { name: '+ Add a card', exact: true }).click()
  await column(page, list).getByLabel('Card title', { exact: true }).fill(title)
  await column(page, list).getByRole('button', { name: 'Add card', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(column(page, list).getByRole('button', { name: title, exact: true })).toBeVisible()
}
export async function openBoardCard(page: Page, title: string) {
  await page.getByRole('button', { name: title, exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Card details' })).toBeVisible()
}
