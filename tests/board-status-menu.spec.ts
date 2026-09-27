import { expect, test } from '@playwright/test'
import { addBoardCard, openBoard, openBoardCard } from './support/board-fixtures'

test.use({ viewport: { width: 320, height: 500 }, hasTouch: true })

test('a long status menu scrolls on touch and selecting its last option saves normally', async ({ page }) => {
  await openBoard(page)
  await addBoardCard(page, 'Touch status')
  await page.evaluate(() => {
    const boards = JSON.parse(localStorage.getItem('lean-canvas:boards:v1')!)
    const board = Object.values(boards)[0] as { columns: { id: string; title: string }[] }
    board.columns.push(...Array.from({ length: 30 }, (_, index) => ({ id: `custom-${index}`, title: `Custom status ${index}` })))
    localStorage.setItem('lean-canvas:boards:v1', JSON.stringify(boards))
    window.dispatchEvent(new Event('lean-canvas-board-change'))
  })
  await openBoardCard(page, 'Touch status')
  const modal = page.getByRole('dialog')
  const trigger = modal.getByRole('combobox', { name: 'Status', exact: true })
  await trigger.tap()
  const menu = page.getByRole('listbox', { name: 'Status', exact: true })
  await expect(menu).toBeVisible()
  const last = page.getByRole('option', { name: 'Custom status 29', exact: true })
  await last.scrollIntoViewIfNeeded()
  await expect(last).toBeInViewport()
  const bounds = (await menu.boundingBox())!
  expect(bounds.y).toBeGreaterThanOrEqual(0)
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(500)
  await last.tap()
  await expect(menu).toHaveCount(0)
  await expect(trigger).toHaveText('Custom status 29')
  await modal.getByRole('button', { name: 'Save', exact: true }).tap()
  await openBoardCard(page, 'Touch status')
  await expect(trigger).toHaveText('Custom status 29')
})

for (const fallback of [false, true]) test(`outside tap dismisses only the menu (fallback=${fallback})`, async ({ page }) => {
  if (fallback) await page.addInitScript(() => Reflect.deleteProperty(HTMLDialogElement.prototype, 'closedBy'))
  await openBoard(page)
  await addBoardCard(page, 'Dismiss menu')
  await openBoardCard(page, 'Dismiss menu')
  const modal = page.getByRole('dialog')
  if (fallback) await modal.evaluate((element) => element.setAttribute('closedby', 'closerequest'))
  const title = (await modal.getByRole('textbox', { name: 'Title', exact: true }).boundingBox())!
  await modal.getByRole('combobox', { name: 'Status', exact: true }).tap()
  await expect(page.getByRole('listbox')).toBeVisible()
  // Use a point inside the dialog but outside the anchored menu.
  await page.touchscreen.tap(title.x + title.width - 2, title.y + 4)
  await expect(page.getByRole('listbox')).toHaveCount(0)
  await expect(modal).toBeVisible()
  await expect(modal.getByRole('combobox', { name: 'Status', exact: true })).toHaveText('Backlog')
})
