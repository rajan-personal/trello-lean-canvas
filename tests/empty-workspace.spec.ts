import { expect, test } from '@playwright/test'
import { dump } from 'js-yaml'
import { sectionTemplate } from '../src/data/sections'

for (const width of [320, 390, 1440]) {
  test(`empty workspace fits, centers content, and follows keyboard order at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const content = page.locator('main section')
    await expect(content.getByRole('heading', { name: 'No canvases yet' })).toBeVisible()
    const bounds = await content.boundingBox()
    const main = await page.locator('main').boundingBox()
    expect(Math.abs(bounds!.x + bounds!.width / 2 - (main!.x + main!.width / 2))).toBeLessThan(1)
    expect(Math.abs(bounds!.y + bounds!.height / 2 - (main!.y + main!.height / 2))).toBeLessThan(1)
    expect(bounds!.width).toBeLessThanOrEqual(360)
    expect(bounds!.x).toBeGreaterThanOrEqual(24)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width - 24)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const create = content.getByRole('button', { name: 'New canvas' })
    await create.focus()
    await expect(create).toBeFocused()
    await create.press('Tab')
    await expect(content.getByRole('button', { name: 'Import YAML' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(content.getByRole('button', { name: 'Try sample canvases' })).toBeFocused()
    expect((await create.boundingBox())!.height).toBe(36)
    for (const button of await content.getByRole('button').all()) {
      expect((await button.boundingBox())!.height).toBeGreaterThan(0)
      await button.focus()
      await expect(button).toHaveCSS('outline-style', 'solid')
      await expect(button).toHaveCSS('outline-width', '2px')
      await expect(button).toHaveCSS('outline-offset', '2px')
      await expect(button).toHaveCSS('outline-color', 'rgb(255, 255, 255)')
    }
    await page.screenshot({ path: test.info().outputPath(`empty-${width}.png`) })
  })
}

test('starter create opens the dialog and removes the empty state after creation', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'New canvas', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Create canvas' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('textbox', { name: 'Canvas name' }).fill('First research')
  await dialog.getByRole('button', { name: 'Create canvas', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'First research' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'No canvases yet' })).toHaveCount(0)
})

test('starter upload opens the imported canvas', async ({ page }) => {
  await page.goto('/')
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Import YAML' }).click()
  const yaml = dump({ canvas: { name: 'Imported research', title: 'Imported research', sections: sectionTemplate.map((section) => ({ ...section, cards: [] })) } })
  await (await chooser).setFiles({ name: 'research.yaml', mimeType: 'application/yaml', buffer: Buffer.from(yaml) })
  await expect(page.getByRole('heading', { name: 'Imported research' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'No canvases yet' })).toHaveCount(0)
})

test('starter samples open Airbnb and remove the empty state', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Try sample canvases' }).click()
  await expect(page.getByRole('heading', { name: 'Airbnb — 2008' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'No canvases yet' })).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Workspace navigation' }).locator('.canvas-nav-item')).toHaveCount(4)
})
