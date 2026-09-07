import { expect, test } from '@playwright/test'
import { addBoardCard, openBoard, openBoardCard } from './support/board-fixtures'

for (const width of [320, 390, 1200]) test.describe(`${width}px layout`, () => {
  test.use({ hasTouch: width < 760 })
  test(`compact story points sit beside Description without overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 710 })
    await openBoard(page)
    await addBoardCard(page, 'Estimate this ticket')
    await openBoardCard(page, 'Estimate this ticket')
    const modal = page.getByRole('dialog', { name: 'Card details' })
    const points = modal.getByRole('combobox', { name: 'Story points' })
    await expect(points).toHaveValue('')
    await expect(points.getByRole('option', { name: 'Not estimated' })).toHaveAttribute('value', '')
    await points.selectOption('13')
    await expect(points).toHaveAccessibleDescription(/split it/)
    await expect(points).toHaveAttribute('title', /split it/)
    const heading = (await modal.locator('.kanban-description-heading').boundingBox())!
    const label = (await modal.locator('.kanban-description-heading > label').boundingBox())!
    const field = (await modal.locator('.kanban-story-points-field').boundingBox())!
    const select = (await points.boundingBox())!
    const description = (await modal.getByRole('textbox', { name: 'Description', exact: true }).boundingBox())!
    expect(select.width).toBe(60)
    expect(select.height).toBe(width < 760 ? 48 : 32)
    expect(heading.height).toBeLessThanOrEqual(48)
    expect(field.x).toBeGreaterThan(label.x + label.width)
    expect(select.x + select.width).toBeCloseTo(description.x + description.width, 0)
    expect(select.y + select.height / 2).toBeCloseTo(label.y + label.height / 2, 0)
    expect(description.y - heading.y - heading.height).toBeLessThanOrEqual(8)
    expect(await modal.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    if (width === 1200) expect(await modal.evaluate((element) => element.scrollHeight <= element.clientHeight)).toBe(true)
    await modal.getByRole('button', { name: 'Save', exact: true }).click()
    await page.getByRole('button', { name: 'Estimate this ticket 13+ story points' }).click()
    await expect(points).toHaveValue('13')
  })
})
