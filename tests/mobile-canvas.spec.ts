import { expect, test } from '@playwright/test'
import { openSampleCanvas } from './support/canvas-fixtures'

test('mobile stacked panels retain editing and cross-section drag', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await openSampleCanvas(page)
  const problem = page.locator('.problem .canvas-cell').first()
  await problem.locator('.card-content').first().dblclick()
  await problem.getByRole('textbox', { name: 'Edit card' }).fill('Edited mobile problem')
  await problem.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(problem.getByRole('button', { name: 'Edited mobile problem', exact: true })).toBeVisible()
  const cost = page.locator('.cost .canvas-cell')
  const source = problem.locator('.canvas-card').first()
  await source.scrollIntoViewIfNeeded()
  const sourceBox = (await source.boundingBox())!
  await page.mouse.move(sourceBox.x + 20, sourceBox.y + 15)
  await page.mouse.down()
  await page.mouse.move(sourceBox.x + 30, sourceBox.y + 25, { steps: 3 })
  const target = cost.locator('.canvas-card').first()
  await target.scrollIntoViewIfNeeded()
  const targetBox = (await target.boundingBox())!
  await page.mouse.move(targetBox.x + 20, targetBox.y + 2, { steps: 3 })
  await page.mouse.up()
  await expect(cost.locator('.card-content').first()).toHaveText('Edited mobile problem')
  await expect(problem.getByRole('button', { name: 'Edited mobile problem', exact: true })).toHaveCount(0)
  await page.reload()
  await expect(cost.locator('.card-content').first()).toHaveText('Edited mobile problem')
  expect(await page.locator('.board-scroll').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
})
