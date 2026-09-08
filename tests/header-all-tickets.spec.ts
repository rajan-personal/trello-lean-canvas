import { expect, test } from '@playwright/test'
import { canvas } from '../unit/fixtures'

for (const width of [1440, 375, 320]) {
  test(`shows an icon-only All tickets button between menu and add at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.addInitScript((project) => {
      localStorage.clear()
      localStorage.setItem('lean-canvas:v2', JSON.stringify([project]))
    }, canvas('project-0'))
    await page.goto('/project/project-0/ticket')
    const header = page.locator('.topbar')
    const button = header.getByRole('button', { name: 'All tickets', exact: true })
    const menu = header.getByRole('button', { name: width < 761 ? 'Open sidebar' : 'Collapse sidebar' })
    const add = header.getByRole('button', { name: 'Add canvas' })
    await expect(button).toBeVisible()
    await expect(button).toHaveText('')
    await expect(button.locator('svg.lucide-ticket')).toBeVisible()
    await expect(menu.locator('svg.lucide-menu')).toBeVisible()
    await expect(page.locator('#canvas-sidebar button').filter({ hasText: 'All tickets' })).toHaveCount(0)
    const menuBox = (await menu.boundingBox())!
    const buttonBox = (await button.boundingBox())!
    const addBox = (await add.boundingBox())!
    expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(buttonBox.x)
    expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(addBox.x)
    expect(buttonBox.y + buttonBox.height / 2).toBe(menuBox.y + menuBox.height / 2)
    expect(buttonBox.y + buttonBox.height / 2).toBe(addBox.y + addBox.height / 2)
    expect(await page.locator('body').evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(width)
    await menu.focus(); await page.keyboard.press('Tab'); await expect(button).toBeFocused()
    await page.keyboard.press('Tab'); await expect(add).toBeFocused()
    await button.focus(); await page.keyboard.press('Enter')
    await expect(page).toHaveURL('/tickets')
    await expect(page.getByRole('main', { name: 'All tickets' })).toBeVisible()
    await expect(button).toHaveAttribute('aria-current', 'page')
    await page.goBack(); await expect(page).toHaveURL('/project/project-0/ticket')
    await expect(button).not.toHaveAttribute('aria-current')
    if (width < 761) {
      await menu.click(); await button.click()
      await expect(page).toHaveURL('/tickets')
      await expect(page.locator('#canvas-sidebar')).toHaveAttribute('aria-hidden', 'true')
    }
  })
}
