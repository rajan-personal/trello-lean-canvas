import { expect, type Page } from '@playwright/test'

export async function expectHeaderLayout(page: Page, width: number) {
  const header = page.locator('.topbar')
  const tabs = header.getByRole('tablist')
  const favorite = header.getByRole('button', { name: 'Favorite canvas' })
  await expect(tabs).toHaveCount(1)
  expect(await tabs.evaluate((element) => element.nextElementSibling?.getAttribute('aria-label'))).toBe('Favorite canvas')
  const [tabBox, starBox, groupBox, titleBox, headerBox] = await Promise.all([
    tabs.boundingBox(), favorite.boundingBox(), header.locator('.topbar-actions').boundingBox(),
    header.getByRole('heading').boundingBox(), header.boundingBox(),
  ])
  expect(starBox!.x - (tabBox!.x + tabBox!.width)).toBeGreaterThanOrEqual(0)
  expect(starBox!.x - (tabBox!.x + tabBox!.width)).toBeLessThanOrEqual(8)
  expect(starBox!.y + starBox!.height / 2).toBe(tabBox!.y + tabBox!.height / 2)
  expect(headerBox!.height).toBe(width <= 760 ? 92 : 48)
  const lastBox = await header.getByRole('button', { name: 'Delete canvas' }).boundingBox()
  expect(width - (lastBox!.x + lastBox!.width)).toBe(width <= 760 ? 6 : 12)
  if (width <= 760) {
    expect(groupBox!.y).toBe(48)
    expect(titleBox!.y + titleBox!.height).toBeLessThanOrEqual(groupBox!.y)
  } else {
    expect(titleBox!.x + titleBox!.width).toBeLessThanOrEqual(tabBox!.x)
    expect(await header.locator('.toolbar-spacer').evaluate((element) =>
      element.nextElementSibling?.classList.contains('topbar-actions'))).toBe(true)
  }
  const controls = await header.locator('button:visible, input:visible').all()
  const boxes = await Promise.all(controls.map((control) => control.boundingBox()))
  for (const [index, control] of controls.entries()) {
    const box = boxes[index]!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(width)
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.y + box.height).toBeLessThanOrEqual(headerBox!.height)
    expect(box.width).toBeGreaterThanOrEqual(27)
    expect(box.height).toBeGreaterThanOrEqual(27)
    expect(await control.evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      return element.contains(document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2))
    })).toBe(true)
    for (const other of boxes.slice(index + 1)) {
      const overlapX = Math.min(box.x + box.width, other!.x + other!.width) - Math.max(box.x, other!.x)
      const overlapY = Math.min(box.y + box.height, other!.y + other!.height) - Math.max(box.y, other!.y)
      expect(overlapX > 0 && overlapY > 0).toBe(false)
    }
  }
  for (const tab of await tabs.getByRole('tab').all()) {
    expect(await tab.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    await expect(tab.locator('svg')).toHaveAttribute('aria-hidden', 'true')
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
}
