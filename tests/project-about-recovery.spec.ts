import { expect, test } from '@playwright/test'
import { loadSamples } from './support/canvas-fixtures'

test('keeps details after a failed save and lets the user retry', async ({ page }) => {
  await loadSamples(page)
  await page.getByRole('tab', { name: 'About', exact: true }).click()
  await page.evaluate(() => {
    const setItem = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'lean-canvas:v2' && sessionStorage.getItem('test:fail-save')) {
        throw new Error('Storage unavailable')
      }
      setItem.call(this, key, value)
    }
    sessionStorage.setItem('test:fail-save', 'true')
  })
  const details = page.getByRole('textbox', { name: 'Project details' })
  await details.fill('Keep this overview until saving succeeds.')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('tabpanel', { name: 'About' }).getByRole('status')).toContainText('Changes could not be saved')
  await expect(details).toHaveValue('Keep this overview until saving succeeds.')
  await page.evaluate(() => sessionStorage.removeItem('test:fail-save'))
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('tabpanel', { name: 'About' }).getByRole('status')).toContainText('All changes saved')
  await page.reload()
  await expect(details).toHaveValue('Keep this overview until saving succeeds.')
})
