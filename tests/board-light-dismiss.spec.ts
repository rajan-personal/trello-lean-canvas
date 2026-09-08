import { expect, test } from '@playwright/test'
import { addBoardCard, openBoard, openBoardCard } from './support/board-fixtures'

for (const fallback of [false, true]) test.describe(fallback ? 'light-dismiss fallback' : 'native light-dismiss', () => {
  test.beforeEach(async ({ page }) => {
    if (fallback) await page.addInitScript(() => {
      Reflect.deleteProperty(HTMLDialogElement.prototype, 'closedBy')
    })
    await openBoard(page)
    await addBoardCard(page, 'Outside-click ticket')
    await openBoardCard(page, 'Outside-click ticket')
    await expect(page.getByRole('dialog')).toHaveAttribute('closedby', 'any')
    // Disable the browser implementation so these cases really exercise our fallback.
    if (fallback) await page.getByRole('dialog').evaluate((dialog) => dialog.setAttribute('closedby', 'closerequest'))
  })

  test('outside click closes to the parent route, restores focus, and keeps the card', async ({ page }) => {
    const ticket = page.url()
    await page.mouse.click(4, 4)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page).toHaveURL(ticket.slice(0, ticket.lastIndexOf('/')))
    await expect(page.getByRole('button', { name: 'Outside-click ticket', exact: true })).toBeFocused()
    await openBoardCard(page, 'Outside-click ticket')
    await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Outside-click ticket')
  })

  test('content, padding, and drags across the edge do not dismiss', async ({ page }) => {
    const modal = page.getByRole('dialog')
    await page.getByRole('heading', { name: 'Card details' }).click()
    const box = (await modal.boundingBox())!
    await page.mouse.click(box.x + 3, box.y + 3)
    await expect(modal).toBeVisible()
    const title = (await page.getByLabel('Title', { exact: true }).boundingBox())!
    await page.mouse.move(title.x + 20, title.y + 20)
    await page.mouse.down()
    await page.mouse.move(4, 4)
    await page.mouse.up()
    await expect(modal).toBeVisible()
    await page.mouse.move(4, 4)
    await page.mouse.down()
    await page.mouse.move(box.x + 3, box.y + 3)
    await page.mouse.up()
    await expect(modal).toBeVisible()
    await page.mouse.click(4, 4)
    await expect(modal).toHaveCount(0)
  })

  for (const field of ['Title', 'Description', 'New comment', 'Story points']) {
    test('protects unsaved ' + field + ' until discard is confirmed', async ({ page }) => {
      const ticket = page.url()
      const input = page.getByRole(field === 'Story points' ? 'combobox' : 'textbox', { name: field, exact: true })
      const value = field === 'Story points' ? '5' : 'Keep this draft'
      if (field === 'Story points') await input.selectOption(value)
      else await input.fill(value)
      page.once('dialog', async (dialog) => {
        expect(dialog.message()).toBe('Discard unsaved changes?')
        await dialog.dismiss()
      })
      await page.mouse.click(4, 4)
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page).toHaveURL(ticket)
      await expect(input).toHaveValue(value)
      page.once('dialog', async (dialog) => { await dialog.accept() })
      await page.mouse.click(4, 4)
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await openBoardCard(page, 'Outside-click ticket')
      await expect(input).toHaveValue(field === 'Title' ? 'Outside-click ticket' : '')
    })
  }

  test('direct links dismiss without leaving the board', async ({ page }) => {
    const ticket = page.url()
    await page.goto(ticket)
    await expect(page.getByRole('dialog')).toBeVisible()
    if (fallback) await page.getByRole('dialog').evaluate((dialog) => dialog.setAttribute('closedby', 'closerequest'))
    await page.mouse.click(4, 4)
    await expect(page).toHaveURL(ticket.slice(0, ticket.lastIndexOf('/')))
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('tab', { name: 'Tickets', exact: true })).toBeFocused()
  })

  test('Escape still uses the guarded close path', async ({ page }) => {
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
})

test('mobile backdrop tap closes card details', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })
  const page = await context.newPage()
  await openBoard(page)
  await addBoardCard(page, 'Touch ticket')
  await openBoardCard(page, 'Touch ticket')
  await page.touchscreen.tap(4, 4)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Touch ticket', exact: true })).toBeVisible()
  await context.close()
})
