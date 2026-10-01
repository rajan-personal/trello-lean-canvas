import { expect, test, type Locator } from '@playwright/test'
import { addBoardCard, column, openBoard, openBoardCard } from './support/board-fixtures'

async function expectBottomRightBadge(card: Locator, value: string) {
  const badge = card.locator('.kanban-story-points-badge')
  await expect(badge).toHaveText(value)
  const cardBox = (await card.boundingBox())!
  const badgeBox = (await badge.boundingBox())!
  expect(cardBox.x + cardBox.width - badgeBox.x - badgeBox.width).toBeCloseTo(12, 0)
  expect(cardBox.y + cardBox.height - badgeBox.y - badgeBox.height).toBeCloseTo(11, 0)
}

test('estimates persist on cards and in details after reload and movement, and can be cleared', async ({ page }) => {
  await openBoard(page)
  await addBoardCard(page, 'Add image upload')
  await openBoardCard(page, 'Add image upload')
  const modal = page.getByRole('dialog', { name: 'Card details' })
  const points = modal.getByRole('combobox', { name: 'Story points' })
  const choosePoints = async (value: string) => {
    await points.click()
    await modal.getByRole('option', { name: value === '' ? 'Not estimated' : value === '13' ? '13+' : value, exact: true }).click()
    await expect(points).toBeFocused()
  }
  await expect(points).toHaveText('—')
  await points.click()
  await expect(modal.getByRole('option')).toHaveText(['Not estimated', '1', '3', '5', '8', '13+'])
  await page.keyboard.press('Escape')
  await expect(modal.getByRole('listbox')).toHaveCount(0)
  await expect(points).toBeFocused()
  for (const [value, guidance] of [['1', 'Tiny, clear change'], ['3', 'Small standard task'], ['5', 'Moderate complexity'], ['8', 'Complex or risky'], ['13', 'split it']]) {
    await choosePoints(value)
    await expect(points).toHaveAccessibleDescription(new RegExp(guidance))
  }
  await choosePoints('5')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  const card = page.getByRole('button', { name: 'Add image upload 5 story points', exact: true })
  await expect(card).toBeVisible()
  await expectBottomRightBadge(card, '5')
  await card.dragTo(column(page, 'Todo'))
  await expect(column(page, 'Todo').locator('.kanban-story-points-badge')).toHaveText('5')
  await page.reload()
  await card.click()
  await expect(points).toHaveText('5')
  await choosePoints('13')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByRole('button', { name: 'Add image upload 13+ story points', exact: true }).click()
  await expect(points).toHaveText('13+')
  await choosePoints('')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.locator('.kanban-story-points-badge')).toHaveCount(0)
  await page.reload()
  await openBoardCard(page, 'Add image upload')
  await expect(points).toHaveText('—')
})

test('point-only drafts are keyboard accessible and protected by discard confirmation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openBoard(page)
  await addBoardCard(page, 'Change button text')
  await openBoardCard(page, 'Change button text')
  const modal = page.getByRole('dialog')
  const points = modal.getByRole('combobox', { name: 'Story points' })
  const choosePoints = async (value: string) => {
    await points.click()
    await modal.getByRole('option', { name: value === '' ? 'Not estimated' : value === '13' ? '13+' : value, exact: true }).click()
    await expect(points).toBeFocused()
  }
  await expect(modal.getByRole('textbox', { name: 'Title', exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(points).toBeFocused()
  await choosePoints('1')
  await expect(points).toHaveText('1')
  page.once('dialog', (dialog) => dialog.dismiss())
  await modal.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(points).toHaveText('1')
  page.once('dialog', (dialog) => dialog.accept())
  await page.keyboard.press('Escape')
  await openBoardCard(page, 'Change button text')
  await expect(points).toHaveText('—')
  const bounds = await points.boundingBox()
  expect(bounds!.width).toBeGreaterThanOrEqual(72)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390)
  await choosePoints('1')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  const card = page.getByRole('button', { name: 'Change button text 1 story point', exact: true })
  await expect(card).toBeVisible()
  await expectBottomRightBadge(card, '1')
})
