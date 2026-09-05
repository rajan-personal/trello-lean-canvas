import { expect, test } from '@playwright/test'
import { column, openBoard } from './support/board-fixtures'

for (const kind of ['card', 'column'] as const) test(`inline ${kind} composer retains failed drafts and stable IDs, guards exits`, async ({ page }) => {
  await openBoard(page)
  const trigger = kind === 'card' ? column(page, 'Backlog').getByRole('button', { name: '+ Add a card', exact: true }) :
    page.getByRole('button', { name: '+ Add another column', exact: true })
  await trigger.click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const form = page.getByRole('form', { name: `Add ${kind}`, exact: true })
  const input = form.getByRole('textbox')
  await expect(input).toBeFocused()
  await input.fill(`Draft ${kind}`)
  page.once('dialog', dialog => dialog.dismiss())
  await page.getByRole('tab', { name: 'Canvas', exact: true }).click()
  await expect(input).toHaveValue(`Draft ${kind}`)
  page.once('dialog', dialog => dialog.dismiss())
  await input.press('Escape')
  await expect(input).toHaveValue(`Draft ${kind}`)
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'lean-canvas:boards:v1') {
        Object.assign(window, { attemptedBoard: value })
        throw new Error('Composer storage unavailable')
      }
      return original.call(this, key, value)
    }
    Object.assign(window, { restoreComposerStorage: () => { Storage.prototype.setItem = original } })
  })
  await form.getByRole('button', { name: `Add ${kind}`, exact: true }).click()
  await expect(form.getByRole('alert')).toContainText('Composer storage unavailable')
  await expect(input).toHaveValue(`Draft ${kind}`)
  const attempted = await page.evaluate(() => {
    const state = window as unknown as { attemptedBoard: string; restoreComposerStorage: () => void }
    state.restoreComposerStorage()
    return JSON.parse(state.attemptedBoard)
  })
  await form.getByRole('button', { name: `Add ${kind}`, exact: true }).click()
  await expect(form).toHaveCount(0)
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('lean-canvas:boards:v1')!))
  expect(saved).toEqual(attempted)
  await page.reload()
  await page.getByRole('tab', { name: 'Board', exact: true }).click()
  if (kind === 'card') await expect(column(page, 'Backlog').locator('.kanban-card')).toHaveText('Draft card')
  else await expect(column(page, 'Draft column')).toBeVisible()
})
