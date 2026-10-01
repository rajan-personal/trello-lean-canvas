import { expect, test } from '@playwright/test'
import { openSampleCanvas } from './support/canvas-fixtures'

for (const width of [1440, 390]) {
  test(`notepad header closes with focus return at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await openSampleCanvas(page)
    const more = page.getByRole('button', { name: 'More actions', exact: true })
    if (width <= 760) await more.click()
    const opener = page.getByRole('button', { name: 'Notepad', exact: true })
    await opener.click()
    const panel = page.getByRole('complementary', { name: 'Notepad' })
    const notes = panel.getByRole('textbox', { name: 'Canvas notes' })
    await expect(panel.getByRole('heading', { name: 'Canvas notes' })).toBeVisible()
    await expect(panel.locator('header p')).toHaveText('Saved')
    await expect(notes).toBeFocused()
    await expect(panel.locator('.project-rich-text-editor')).toHaveCSS('outline-style', 'none')
    await expect(panel.locator('.rich-text-toolbar')).toHaveCSS('box-shadow', 'rgb(12, 102, 228) 0px -2px 0px 0px inset')
    const close = panel.getByRole('button', { name: 'Close notepad' })
    expect(await close.evaluate((element) => [element.clientWidth, element.clientHeight])).toEqual([32, 32])
    if (width > 760) {
      const handle = panel.getByRole('separator')
      const line = handle.locator('span').first()
      await expect(line).toHaveCSS('width', '1px')
      await expect(line).toHaveCSS('background-color', 'rgb(193, 199, 208)')
      await expect(handle.locator('span').last()).toHaveCSS('height', '32px')
      await handle.hover()
      await expect(line).toHaveCSS('background-color', 'rgb(12, 102, 228)')
      await close.focus()
      await close.press('Shift+Tab')
      await handle.focus()
      await expect(line).toHaveCSS('background-color', 'rgb(12, 102, 228)')
    }
    await close.click()
    await expect(page.locator('#canvas-notepad')).toHaveAttribute('aria-hidden', 'true')
    await expect(width <= 760 ? more : opener).toBeFocused()
  })
}

test('notepad shows a scheduled save before the local persistence timer runs', async ({ page }) => {
  await openSampleCanvas(page)
  await page.getByRole('button', { name: 'Notepad', exact: true }).click()
  const notes = page.getByRole('textbox', { name: 'Canvas notes' })
  await expect(notes).toBeFocused()
  const time = new Date('2026-10-02T00:00:00Z')
  await page.clock.install({ time })
  await page.clock.pauseAt(new Date(time.getTime() + 100))
  await notes.fill('Check the pending status')
  await expect(page.locator('#canvas-notepad header p')).toHaveText('Saving…')
  await page.clock.resume()
  await expect(page.locator('#canvas-notepad header p')).toHaveText('Saved')
})
