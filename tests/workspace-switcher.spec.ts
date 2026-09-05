import { expect, test } from '@playwright/test'
import { openSampleCanvas } from './support/canvas-fixtures'
import { expectHeaderLayout } from './support/header-layout'

for (const width of [320, 375, 760, 761, 1424]) {
  test(`right action cluster fits titles, keyboard navigation and notes at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await openSampleCanvas(page)
    await expectHeaderLayout(page, width)
    const title = page.getByRole('heading').getByRole('button')
    await title.click()
    const input = page.getByRole('textbox', { name: 'Rename canvas' })
    const longName = 'Customer research and launch planning across distributed product teams'
    await input.fill(longName)
    await expectHeaderLayout(page, width)
    await input.press('Enter')
    await expect(title).toHaveText(longName)
    await expect(title).toBeFocused()
    await expectHeaderLayout(page, width)
    await title.press('Enter')
    await input.fill('Discard this rename')
    await expectHeaderLayout(page, width)
    await input.press('Escape')
    await expect(title).toHaveText(longName)
    await expect(title).toBeFocused()
    const canvas = page.getByRole('tab', { name: 'Canvas', exact: true })
    const board = page.getByRole('tab', { name: 'Board', exact: true })
    const favorite = page.getByRole('button', { name: 'Favorite canvas' })
    await page.keyboard.press('Tab')
    await expect(canvas).toBeFocused()
    for (const key of ['End', 'ArrowRight', 'ArrowLeft', 'Home']) {
      await page.keyboard.press(key)
      const selected = key === 'End' || key === 'ArrowLeft' ? board : canvas
      await expect(selected).toBeFocused()
      await expect(selected).toHaveAttribute('aria-selected', 'true')
      await expect(page.getByRole('tabpanel')).toHaveAccessibleName(await selected.innerText())
      await page.keyboard.press('Tab')
      await expect(favorite).toBeFocused()
      await page.keyboard.press('Shift+Tab')
      await expect(selected).toBeFocused()
    }
    await favorite.click()
    await expect(favorite).toHaveAttribute('aria-pressed', 'true')
    if (width > 760) {
      await page.getByRole('button', { name: 'Collapse sidebar' }).click()
      await expect(page.locator('#canvas-sidebar')).toHaveAttribute('inert', '')
      await expectHeaderLayout(page, width)
      await page.getByRole('button', { name: 'Expand sidebar' }).click()
      await expect(page.locator('#canvas-sidebar')).not.toHaveAttribute('inert', '')
    }
    await page.getByRole('button', { name: 'Notepad', exact: true }).click()
    await expect(page.getByRole('textbox', { name: 'Canvas notes' })).toBeVisible()
    await expectHeaderLayout(page, width)
    const notes = await page.locator('#canvas-notepad').boundingBox()
    expect(notes!.y).toBe(width <= 760 ? 92 : 48)
    await board.click()
    await expect(board).toHaveAttribute('aria-selected', 'true')
    await expectHeaderLayout(page, width)
    await favorite.click()
    await expect(favorite).toHaveAttribute('aria-pressed', 'false')
    await canvas.click()
    await expect(canvas).toHaveAttribute('aria-selected', 'true')
  })
}

test('empty mobile workspace keeps its single title row', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Add canvas' })).toBeVisible()
  await expect(page.getByRole('tablist')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Favorite canvas' })).toHaveCount(0)
  await expect(page.locator('.topbar')).toHaveCSS('height', '48px')
  expect((await page.locator('.workspace-layout').boundingBox())!.y).toBe(48)
})
