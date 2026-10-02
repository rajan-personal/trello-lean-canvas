import { expect, test } from '@playwright/test'
import { loadSamples } from './support/canvas-fixtures'

for (const width of [1440, 390]) {
  test(`sidebar has distinct chrome and a high-contrast active item at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await loadSamples(page)
    await page.getByRole('button', { name: 'Favorite canvas', exact: true }).click()
    if (width <= 760) await page.getByRole('button', { name: 'Open sidebar', exact: true }).click()

    const sidebar = page.locator('#canvas-sidebar')
    const active = sidebar.getByRole('button', { name: 'Airbnb', exact: true })
    const inactive = sidebar.getByRole('button', { name: 'Facebook', exact: true })
    await expect(sidebar).toHaveCSS('background-color', 'rgb(11, 74, 111)')
    await expect(sidebar).toHaveCSS('border-right-width', '1px')
    await expect(active).toHaveCSS('background-color', 'rgb(255, 255, 255)')
    await expect(active).toHaveCSS('color', 'rgb(18, 52, 74)')
    await expect(active).toHaveCSS('font-weight', '600')
    await expect(active.locator('.canvas-nav-favorite')).toHaveCSS('color', 'rgb(148, 111, 0)')

    await active.press('Tab')
    await page.keyboard.press('Shift+Tab')
    await expect(active).toBeFocused()
    await expect(active).toHaveCSS('outline-color', 'rgb(12, 102, 228)')
    await expect(active).toHaveCSS('outline-width', '2px')
    await expect(active).toHaveCSS('outline-offset', '-2px')
    await active.press('Tab')
    await expect(inactive).toBeFocused()
    await expect(inactive).toHaveCSS('outline-color', 'rgb(255, 255, 255)')

    if (width > 760) {
      await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).click()
      await expect(sidebar).toHaveCSS('width', '0px')
      await expect(sidebar).toHaveCSS('border-right-width', '0px')
      await expect(sidebar).toHaveCSS('box-shadow', /^(none|rgba\(0, 0, 0, 0\) 0px 0px 0px 0px(, rgba\(0, 0, 0, 0\) 0px 0px 0px 0px)*)$/)
    }
  })
}
