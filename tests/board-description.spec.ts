import { expect, test } from '@playwright/test'
import { addBoardCard, openBoard, openBoardCard } from './support/board-fixtures'

for (const fallback of [false, true]) test(`description grows with long text and persists (fallback=${fallback})`, async ({ page }) => {
  if (fallback) await page.addInitScript(() => {
    const supports = CSS.supports.bind(CSS)
    CSS.supports = ((...args: string[]) => args[0].includes('field-sizing') ? false :
      args.length === 1 ? supports(args[0]) : supports(args[0], args[1])) as typeof CSS.supports
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style')
      style.textContent = '.kanban-description-field textarea { field-sizing: fixed !important; }'
      document.head.append(style)
    })
  })
  await page.setViewportSize({ width: 1200, height: 710 })
  await openBoard(page)
  await addBoardCard(page, 'Room for the full plan')
  await openBoardCard(page, 'Room for the full plan')
  const modal = page.getByRole('dialog')
  const description = modal.getByRole('textbox', { name: 'Description', exact: true })
  await expect(description).toHaveCSS('field-sizing', fallback ? 'fixed' : 'content')
  const initial = (await description.boundingBox())!.height
  expect(initial).toBeGreaterThanOrEqual(320)
  const text = Array.from({ length: 45 }, (_, index) => `${index + 1}. A detailed part of the plan with enough text to wrap on small screens.`).join('\n')
  await description.fill(text)
  await expect.poll(async () => (await description.boundingBox())!.height).toBeGreaterThan(1000)
  expect(await description.evaluate((element) => element.scrollHeight <= element.clientHeight + 1)).toBe(true)
  expect(await modal.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true)
  await page.setViewportSize({ width: 390, height: 710 })
  await expect.poll(() => description.evaluate((element) => element.scrollHeight <= element.clientHeight + 1)).toBe(true)
  expect(await modal.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  const narrowHeight = (await description.boundingBox())!.height
  await page.setViewportSize({ width: 1200, height: 710 })
  await expect.poll(async () => (await description.boundingBox())!.height).toBeLessThan(narrowHeight)
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await page.reload()
  await page.getByRole('tab', { name: 'Board', exact: true }).click()
  await openBoardCard(page, 'Room for the full plan')
  await expect(description).toHaveCSS('field-sizing', fallback ? 'fixed' : 'content')
  await expect(description).toHaveValue(text)
  await expect.poll(async () => (await description.boundingBox())!.height).toBeGreaterThan(1000)
  await description.fill('Short again')
  await expect.poll(async () => (await description.boundingBox())!.height).toBeLessThan(400)
  await expect(description).toHaveValue('Short again')
})
