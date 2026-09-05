import { expect, test } from '@playwright/test'
import { addBoardCard, column, openBoard, openBoardCard } from './support/board-fixtures'

for (const fallback of [false, true]) for (const populated of [false, true]) {
  test(`column menu Tab exits follow its trigger (fallback=${fallback}, populated=${populated})`, async ({ page }) => {
    if (fallback) await page.addInitScript(() => { delete (HTMLElement.prototype as { popover?: string }).popover })
    await openBoard(page)
    if (populated) await addBoardCard(page, 'Next board control')
    const backlog = column(page, 'Backlog')
    const trigger = backlog.getByRole('button', { name: 'Column actions for Backlog' })
    const next = backlog.getByRole('button', { name: populated ? 'Next board control' : '+ Add a card', exact: true })
    const panel = page.getByRole('group', { name: 'Column actions for Backlog' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(panel.getByRole('button', { name: 'Rename column' })).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(panel).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(next).toBeFocused()
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(panel.getByRole('button', { name: 'Rename column' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(panel.getByRole('button', { name: 'Move column right' })).toBeFocused()
    if (!populated) {
      await page.keyboard.press('Tab')
      await expect(panel.getByRole('button', { name: 'Delete column' })).toBeFocused()
    }
    await page.keyboard.press('Tab')
    await expect(panel).toHaveCount(0)
    await expect(next).toBeFocused()
  })
}

test('Enter does not submit a whitespace-only card title or touch persisted data', async ({ page }) => {
  await openBoard(page)
  await addBoardCard(page, 'Keep original title')
  await openBoardCard(page, 'Keep original title')
  const before = await page.evaluate(() => localStorage.getItem('lean-canvas:boards:v1'))
  const modal = page.getByRole('dialog')
  const title = modal.getByRole('textbox', { name: 'Title', exact: true })
  await title.fill('   ')
  await expect(modal.getByRole('button', { name: 'Save', exact: true })).toBeDisabled()
  await title.press('Enter')
  await expect(modal).toBeVisible()
  await expect(title).toHaveValue('   ')
  await expect(modal.getByRole('alert')).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('lean-canvas:boards:v1'))).toBe(before)
  await title.fill('A valid title')
  await title.press('Enter')
  await expect(modal).toHaveCount(0)
  await expect(column(page, 'Backlog').getByRole('button', { name: 'A valid title', exact: true })).toBeVisible()
})
