import { expect, test } from '@playwright/test'
import { dump } from 'js-yaml'
import { sectionTemplate } from '../src/data/sections'

for (const width of [320, 390, 1440]) {
  test(`starter card fits and follows keyboard order at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const card = page.locator('main section')
    await expect(card.getByRole('heading', { name: 'Start your first Lean Canvas' })).toBeVisible()
    const bounds = await card.boundingBox()
    const main = (await page.locator('main').boundingBox())!
    expect(bounds!.width).toBeLessThanOrEqual(400)
    expect(bounds!.x).toBeGreaterThanOrEqual(16)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width - 16)
    expect(Math.abs(bounds!.x + bounds!.width / 2 - (main.x + main.width / 2))).toBeLessThan(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const create = card.getByRole('button', { name: 'Create canvas' })
    await create.focus()
    await expect(create).toBeFocused()
    await create.press('Tab')
    await expect(card.getByRole('button', { name: 'Upload YAML' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(card.getByRole('button', { name: 'Load sample data' })).toBeFocused()
    expect((await create.boundingBox())!.height).toBe(40)
    for (const button of await card.getByRole('button').all()) {
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(32)
    }
  })
}

test('starter create opens the dialog and removes the card after creation', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Create canvas', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Create canvas' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('textbox', { name: 'Canvas name' }).fill('First research')
  await dialog.getByRole('button', { name: 'Create canvas', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'First research' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Start your first Lean Canvas' })).toHaveCount(0)
})

test('starter upload opens the imported canvas', async ({ page }) => {
  await page.goto('/')
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Upload YAML' }).click()
  const yaml = dump({ canvas: { name: 'Imported research', title: 'Imported research', sections: sectionTemplate.map((section) => ({ ...section, cards: [] })) } })
  await (await chooser).setFiles({ name: 'research.yaml', mimeType: 'application/yaml', buffer: Buffer.from(yaml) })
  await expect(page.getByRole('heading', { name: 'Imported research' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Start your first Lean Canvas' })).toHaveCount(0)
})

test('starter samples open Airbnb and remove the card', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Load sample data' }).click()
  await expect(page.getByRole('heading', { name: 'Airbnb — 2008' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Start your first Lean Canvas' })).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Workspace navigation' }).locator('.canvas-nav-item')).toHaveCount(4)
})
