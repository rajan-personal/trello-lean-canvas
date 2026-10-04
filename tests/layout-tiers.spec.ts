import { expect, test, type Page } from '@playwright/test'
import { openSampleCanvas } from './support/canvas-fixtures'

const sidebar = (page: Page) => page.locator('#canvas-sidebar')
const contentWidth = (page: Page) => page.locator('.workspace-content').evaluate((element) => element.clientWidth)

test.describe('docked tier', () => {
  test('1200px keeps a persistent, collapsible sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 })
    await openSampleCanvas(page)
    await expect(page.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open sidebar' })).toBeHidden()
    await expect(sidebar(page)).not.toHaveAttribute('inert', '')
    expect(await contentWidth(page)).toBe(1200 - 248)
  })
})

for (const viewport of [{ width: 1199, height: 800 }, { width: 1024, height: 768 }, { width: 800, height: 1192 }]) {
  test(`drawer tier at ${viewport.width}×${viewport.height} overlays the sidebar and keeps the desktop header`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openSampleCanvas(page)
    const opener = page.getByRole('button', { name: 'Open sidebar' })
    await expect(opener).toBeVisible()
    await expect(page.getByRole('button', { name: 'Collapse sidebar' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Favorite canvas' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'More actions', exact: true })).toBeHidden()
    await expect(sidebar(page)).toHaveAttribute('inert', '')
    expect(await contentWidth(page)).toBe(viewport.width)
    await opener.click()
    await expect(sidebar(page)).not.toHaveAttribute('inert', '')
    expect(await contentWidth(page)).toBe(viewport.width)
    await page.keyboard.press('Escape')
    await expect(sidebar(page)).toHaveAttribute('inert', '')
    await expect(opener).toBeFocused()
  })
}

test('choosing a canvas from the drawer closes it', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Add canvas' }).click()
  await page.getByRole('button', { name: 'Sample', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Airbnb — 2008' })).toBeVisible()
  await page.getByRole('button', { name: 'Open sidebar' }).click()
  await sidebar(page).getByRole('button', { name: 'Google', exact: true }).click()
  await expect(page.getByRole('heading').getByRole('button')).toContainText('Google')
  await expect(sidebar(page)).toHaveAttribute('inert', '')
})

test('phone landscape uses the phone layout and fits the viewport height', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await openSampleCanvas(page)
  await expect(page.getByRole('button', { name: 'Open sidebar' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'More actions', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Favorite canvas' })).toBeHidden()
  expect(await contentWidth(page)).toBe(844)
  const grid = await page.locator('.lean-grid').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)
  expect(grid).toBe(1)
  const shell = await page.locator('.app-shell').boundingBox()
  expect(shell!.height).toBe(390)
})
