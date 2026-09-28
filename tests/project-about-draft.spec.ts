import { expect, test } from '@playwright/test'
import { openSampleCanvas } from './support/canvas-fixtures'

test('About keeps edits out of persistence until Save and guards discarded drafts', async ({ page }) => {
  await openSampleCanvas(page)
  await page.getByRole('tab', { name: 'About', exact: true }).click()
  const details = page.getByRole('textbox', { name: 'Project details' })
  await details.fill('This is still a draft')
  await expect(page.getByRole('tabpanel', { name: 'About' }).getByRole('status')).toHaveText('Unsaved changes')
  // Saving another project field must not write the About draft.
  await page.getByRole('button', { name: 'Favorite canvas' }).click()
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('lean-canvas:v2')!)[0].favorite)).toBe(true)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('lean-canvas:v2')!)[0].about)).toBe('')
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('tab', { name: 'Canvas', exact: true }).click()
  await expect(details).toHaveValue('This is still a draft')
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('tab', { name: 'Canvas', exact: true }).click()
  await expect(page.getByRole('tabpanel', { name: 'Canvas' })).toBeVisible()
  await page.getByRole('tab', { name: 'About', exact: true }).click()
  await expect(details).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled()
})
