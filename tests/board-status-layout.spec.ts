import { expect, test } from '@playwright/test'
import { addBoardCard, openBoard, openBoardCard } from './support/board-fixtures'

for (const width of [320, 375, 1200]) for (const fallback of [false, true]) {
  test(`status chip is compact and bounded at ${width}px (intrinsic sizing=${fallback})`, async ({ page }) => {
    await page.setViewportSize({ width, height: 710 })
    await openBoard(page)
    await addBoardCard(page, 'Change status')
    await openBoardCard(page, 'Change status')
    if (fallback) await page.addStyleTag({ content: '.kanban-status-field select { field-sizing: fixed !important; }' })
    const modal = page.getByRole('dialog')
    const status = modal.getByRole('combobox', { name: 'Status', exact: true })
    await expect(status).toHaveValue('backlog')
    await expect(modal.getByRole('textbox', { name: 'Title', exact: true })).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Shift+Tab')
    await expect(status).toBeFocused()
    await status.selectOption('todo')
    await expect(status).toHaveValue('todo')
    await status.selectOption('in-progress')
    await expect(status).toHaveAttribute('title', 'In Progress')
    const box = (await status.boundingBox())!
    expect(box.height).toBe(width < 760 ? 44 : 36)
    expect(box.width).toBeLessThan(200)
    expect((await modal.locator('header').boundingBox())!.height).toBeLessThanOrEqual(width < 760 ? 90 : 62)
    expect(await status.evaluate((element: HTMLSelectElement) => element.form?.contains(element.form.querySelector('textarea[name="title"]')))).toBe(true)
    expect(await modal.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)

    // Custom names must not push the header actions out of the dialog.
    await page.evaluate(() => {
      const boards = JSON.parse(localStorage.getItem('lean-canvas:boards:v1')!)
      const board = Object.values(boards)[0] as { columns: { id: string; title: string }[] }
      board.columns.find(({ id }) => id === 'in-progress')!.title = 'Awaiting a very detailed customer review and product approval'
      localStorage.setItem('lean-canvas:boards:v1', JSON.stringify(boards))
      window.dispatchEvent(new Event('lean-canvas-board-change'))
    })
    await expect(status).toHaveAttribute('title', 'Awaiting a very detailed customer review and product approval')
    expect(await modal.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    const header = (await modal.locator('header').boundingBox())!
    const select = (await status.boundingBox())!
    const close = (await modal.getByRole('button', { name: 'Close dialog' }).boundingBox())!
    expect(select.x + select.width).toBeLessThanOrEqual(close.x)
    expect(close.x + close.width).toBeLessThanOrEqual(header.x + header.width)
    await modal.getByRole('button', { name: 'Save', exact: true }).click()
    await openBoardCard(page, 'Change status')
    await expect(status).toHaveValue('in-progress')
  })
}
