import { expect, type Locator, type Page } from '@playwright/test'
import { openSampleCanvas } from './canvas-fixtures'

export async function openBoard(page: Page) {
  await openSampleCanvas(page)
  await page.getByRole('tab', { name: 'Tickets', exact: true }).click()
  await expect(page.locator('.kanban-column')).toHaveCount(6)
}
export const column = (page: Page, name: string) => page.getByRole('region', { name, exact: true })
export async function addBoardCard(page: Page, title: string, list = 'Backlog') {
  await column(page, list).getByRole('button', { name: 'Add a card', exact: true }).click()
  await column(page, list).getByLabel('Card title', { exact: true }).fill(title)
  await column(page, list).getByRole('button', { name: 'Add card', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(column(page, list).getByRole('button', { name: title, exact: true })).toBeVisible()
}
export async function setStatus(page: Page, title: string) {
  await page.getByRole('combobox', { name: 'Status', exact: true }).click()
  await page.getByRole('option', { name: title, exact: true }).click()
  await expect(page.getByRole('listbox', { name: 'Status', exact: true })).toHaveCount(0)
  await expect(page.getByRole('combobox', { name: 'Status', exact: true })).toBeFocused()
}

export async function openBoardCard(page: Page, title: string) {
  await page.getByRole('button', { name: title, exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Card details' })).toBeVisible()
}

export async function expectCardTitles(cards: Locator, titles: string[]) {
  await expect(cards).toHaveCount(titles.length)
  for (const [index, title] of titles.entries()) {
    await expect(cards.nth(index)).toHaveAccessibleName(title)
  }
}
