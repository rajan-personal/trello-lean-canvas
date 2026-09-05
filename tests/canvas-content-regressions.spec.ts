import { expect, test } from '@playwright/test'
import { openSampleCanvas, uploadCanvas } from './support/canvas-fixtures'

test('long multiline cards wrap and bottom-panel creation stays anchored', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await openSampleCanvas(page)
  const long = 'unbroken'.repeat(100)
  await uploadCanvas(page, { name: 'Long content', cards: { problem: [`Heading\n${long}`] } })
  const card = page.locator('.card-content').first()
  expect(await card.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  const revenue = page.locator('.revenue .canvas-cell')
  await revenue.getByRole('button', { name: '＋ Add a card' }).click()
  const composer = revenue.getByRole('textbox', { name: 'New card' })
  await composer.fill('Plan\nMonthly revenue')
  await expect(composer).toBeFocused()
  await composer.press('Enter')
  await expect(revenue.getByRole('button', { name: 'Plan Monthly revenue', exact: true })).toBeVisible()
  expect(await page.locator('.board-scroll').evaluate((el) => el.scrollLeft)).toBeGreaterThan(0)
})

test('dragging between sections and bottom-panel slots preserves ordering', async ({ page }) => {
  await openSampleCanvas(page)
  const problem = page.locator('.problem .canvas-cell').first()
  const cost = page.locator('.cost .canvas-cell')
  const moved = await problem.locator('.card-content').first().innerText()
  await problem.locator('.canvas-card').first().dragTo(cost.locator('.canvas-card').first(), {
    targetPosition: { x: 5, y: 2 },
  })
  await expect(cost.locator('.card-content').first()).toHaveText(moved)
  await expect(problem.getByRole('button', { name: moved, exact: true })).toHaveCount(0)
  await page.reload()
  await expect(cost.locator('.card-content').first()).toHaveText(moved)
})
