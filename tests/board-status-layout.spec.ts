import { expect, test } from '@playwright/test'
import { addBoardCard, openBoard, openBoardCard, setStatus } from './support/board-fixtures'

for (const width of [320, 375, 1200]) test.describe(`${width}px shadcn status select`, () => {
  test.use({ viewport: { width, height: 710 }, hasTouch: width < 760 })

  test('menu stays inside the modal, supports keyboard selection and restores focus', async ({ page }) => {
    await openBoard(page)
    await addBoardCard(page, 'Change status')
    await openBoardCard(page, 'Change status')
    const modal = page.getByRole('dialog')
    const status = modal.getByRole('combobox', { name: 'Status', exact: true })
    await expect(status).toHaveText('Backlog')
    await expect(modal.getByRole('textbox', { name: 'Title', exact: true })).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Shift+Tab')
    await expect(status).toBeFocused()
    await page.keyboard.press('Enter')
    const menu = page.getByRole('listbox', { name: 'Status', exact: true })
    await expect(menu).toBeVisible()
    expect(await menu.evaluate((element) => !!element.closest('dialog[open]'))).toBe(true)
    await expect(page.getByRole('option', { name: 'Backlog', exact: true })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('option', { name: 'Backlog', exact: true })).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('option', { name: 'Todo', exact: true })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(menu).toHaveCount(0)
    await expect(status).toHaveText('Todo')
    await expect(status).toBeFocused()
    await expect(modal.locator('select[name="columnId"]')).toHaveValue('todo')
    await status.click()
    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
    await expect(modal).toBeVisible()
    await expect(status).toBeFocused()
    await status.click()
    await expect(menu).toBeVisible()
    await page.keyboard.type('closed')
    await expect(page.getByRole('option', { name: 'Closed', exact: true })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
    await setStatus(page, 'In Progress')
    const box = (await status.boundingBox())!
    expect(box.height).toBe(width < 760 ? 44 : 36)
    expect(box.width).toBeLessThan(200)
    expect(await modal.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)

    // A custom status must remain readable in the menu without displacing Close.
    const longTitle = 'Awaiting a very detailed customer review and product approval'
    await page.evaluate((title) => {
      const boards = JSON.parse(localStorage.getItem('lean-canvas:boards:v1')!)
      const board = Object.values(boards)[0] as { columns: { id: string; title: string }[] }
      board.columns.find(({ id }) => id === 'in-progress')!.title = title
      localStorage.setItem('lean-canvas:boards:v1', JSON.stringify(boards))
      window.dispatchEvent(new Event('lean-canvas-board-change'))
    }, longTitle)
    await expect(status).toHaveAttribute('title', longTitle)
    const select = (await status.boundingBox())!
    const closeButton = modal.getByRole('button', { name: 'Close dialog' })
    const close = (await closeButton.boundingBox())!
    expect(await closeButton.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)')
    expect(select.x + select.width).toBeLessThanOrEqual(close.x)
    await status.click()
    await expect(page.getByRole('option', { name: longTitle })).toBeVisible()
    const menuBox = (await menu.boundingBox())!
    expect(menuBox.x).toBeGreaterThanOrEqual(0)
    expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(width)
    expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(710)
    expect(await menu.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    await page.keyboard.press('Escape')
    await modal.getByRole('button', { name: 'Save', exact: true }).click()
    await openBoardCard(page, 'Change status')
    await expect(status).toHaveText(longTitle)
  })
})
