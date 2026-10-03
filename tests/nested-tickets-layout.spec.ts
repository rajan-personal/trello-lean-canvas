import { mkdir } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { addBoardCard, openBoard, openBoardCard, setStatus } from './support/board-fixtures'

for (const width of [1440, 390]) test(`nested ticket list and board at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
  await openBoard(page)
  await addBoardCard(page, 'Launch customer accounts')
  await openBoardCard(page, 'Launch customer accounts')
  await page.getByLabel('Description', { exact: true }).fill('Let customers sign in, manage their profile, and recover access to their account.')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await openBoardCard(page, 'Launch customer accounts')
  const parentUrl = page.url()
  for (const [title, status] of [['Email sign-in', 'Done'], ['Account settings', 'In Progress'], ['Password recovery', 'Todo']]) {
    const children = page.getByRole('region', { name: /^Subtasks/ })
    await children.getByRole('button', { name: 'Add ticket', exact: true }).click()
    await children.getByLabel('Ticket title').fill(title)
    await children.getByLabel('Ticket title').press('Enter')
    await children.getByRole('button', { name: `${title} Backlog`, exact: true }).click()
    await setStatus(page, status)
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await page.goto(parentUrl)
    await expect(page.getByRole('dialog')).toBeVisible()
  }
  const children = page.getByRole('region', { name: 'Subtasks 1/3 done' })
  await expect(children).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveJSProperty('scrollWidth', await page.getByRole('dialog').evaluate((el) => el.clientWidth))
  await mkdir('docs/pr-proofs/nested-tickets', { recursive: true })
  await page.screenshot({ path: `docs/pr-proofs/nested-tickets/parent-${width}.png` })
  await children.getByRole('button', { name: 'Open board', exact: true }).click()
  await expect(page).toHaveURL(`${parentUrl}/board`)
  await expect(page.locator('.kanban-card')).toHaveCount(3)
  // Bring the first active column into view on narrow screens.
  if (width === 390) await page.getByRole('region', { name: 'Todo', exact: true }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: `docs/pr-proofs/nested-tickets/board-${width}.png` })
})
