import { expect, test } from '@playwright/test'
import { openSampleCanvas } from './support/canvas-fixtures'

test('opens, expands, and persists the canvas notepad', async ({ page }) => {
  await page.setViewportSize({ width: 1424, height: 797 })
  await openSampleCanvas(page)

  const toggle = page.getByRole('button', { name: 'Notepad', exact: true })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')

  const panel = page.locator('#canvas-notepad')
  const notes = page.getByRole('textbox', { name: 'Canvas notes' })
  await expect(panel).toBeVisible()
  await expect(panel).toHaveAttribute('data-open', 'true')
  await expect
    .poll(() =>
      panel.evaluate((element) =>
        Math.round(element.getBoundingClientRect().width),
      ),
    )
    .toBe(320)
  await expect(panel.getByRole('heading')).toHaveCount(0)
  await expect(panel.getByRole('button')).toHaveCount(0)
  await expect(notes).toBeFocused()
  await notes.fill('Ask five customers about their current workflow.')

  const compactWidth = await panel.evaluate((element) =>
    Math.round(element.getBoundingClientRect().width),
  )
  const handle = page.getByRole('separator', { name: 'Resize notepad' })
  const handleBox = await handle.boundingBox()
  expect(handleBox).not.toBeNull()
  await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + 80)
  await page.mouse.down()
  await page.mouse.move(handleBox!.x - 140, handleBox!.y + 80)
  await page.mouse.up()
  await expect
    .poll(() =>
      panel.evaluate((element) =>
        Math.round(element.getBoundingClientRect().width),
      ),
    )
    .toBeGreaterThan(compactWidth)

  await toggle.click()
  await expect(panel).toHaveAttribute('aria-hidden', 'true')
  await expect
    .poll(() =>
      panel.evaluate((element) =>
        Math.round(element.getBoundingClientRect().width),
      ),
    )
    .toBe(0)
  await toggle.click()
  await expect(notes).toHaveValue(
    'Ask five customers about their current workflow.',
  )

  await page.reload()
  await page.getByRole('button', { name: 'Notepad', exact: true }).click()
  await expect(
    page.getByRole('textbox', { name: 'Canvas notes' }),
  ).toHaveValue('Ask five customers about their current workflow.')
})

test('uses the full workspace for notes on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await openSampleCanvas(page)

  await page.getByRole('button', { name: 'Notepad', exact: true }).click()

  const panel = page.getByRole('complementary', { name: 'Notepad' })
  await expect(panel).toBeVisible()
  await expect(page.getByRole('separator', { name: 'Resize notepad' }))
    .not.toBeVisible()
  await expect
    .poll(() => panel.evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      return {
        left: Math.round(bounds.left),
        right: Math.round(bounds.right),
        top: Math.round(bounds.top),
        bottom: Math.round(bounds.bottom),
      }
    }))
    .toEqual({ left: 0, right: 375, top: 48, bottom: 667 })
})
