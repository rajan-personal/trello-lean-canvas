import { expect, test } from '@playwright/test'
import { loadSamples } from './support/canvas-fixtures'
import { expectHeaderLayout } from './support/header-layout'

for (const width of [320, 375, 390]) {
  test(`mobile header and all More actions work at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 })
    await loadSamples(page)
    await expectHeaderLayout(page, width)
    for (const name of ['Tickets', 'Canvas', 'About']) {
      const tab = page.getByRole('tab', { name, exact: true })
      await expect(tab).toHaveAttribute('title', name)
      await expect(tab.locator('svg')).toBeVisible()
      await expect(tab.locator('span')).toHaveCSS('width', '1px')
    }
    const more = page.getByRole('button', { name: 'More actions', exact: true })
    await more.click()
    await expect(more).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Escape')
    await expect(more).toHaveAttribute('aria-expanded', 'false')
    await more.click()
    await page.getByRole('button', { name: 'Favorite canvas', exact: true }).click()
    await expect(more).toHaveAttribute('aria-expanded', 'false')
    await more.click()
    await expect(page.getByRole('button', { name: 'Favorite canvas', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: 'Favorite canvas', exact: true })).toHaveText('Unfavorite')
    await page.getByRole('button', { name: 'Notepad', exact: true }).click()
    await expect(page.getByRole('textbox', { name: 'Canvas notes' })).toBeVisible()
    await expect(page.locator('#canvas-notepad')).toHaveCSS('top', '48px')
    await page.getByRole('tab', { name: 'About', exact: true }).click()
    await expect(page.getByRole('tab', { name: 'About', exact: true })).toHaveAttribute('aria-selected', 'true')
    await more.click()
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download canvas data as YAML', exact: true }).click()
    expect((await download).suggestedFilename()).toBe('airbnb.yaml')
    await expect(more).toHaveAttribute('aria-expanded', 'false')
    await more.click()
    const dialog = page.waitForEvent('dialog')
    await Promise.all([page.getByRole('button', { name: 'Delete canvas', exact: true }).click(), dialog.then((prompt) => prompt.accept())])
    await expect(page.getByRole('heading', { name: 'Facebook — 2004', exact: true })).toBeVisible()
    await expect(more).toHaveAttribute('aria-expanded', 'false')
    const path = testInfo.outputPath(`mobile-topbar-${width}.png`)
    await page.screenshot({ path, fullPage: true })
    await testInfo.attach(`Mobile header ${width}px`, { path, contentType: 'image/png' })
  })
}
