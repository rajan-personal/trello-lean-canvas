import { expect, test } from '@playwright/test'
import { loadSamples } from './support/canvas-fixtures'

test('About converts only selected text and preserves it after saving', async ({ page }, testInfo) => {
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort())
  await loadSamples(page)
  await page.getByRole('tab', { name: 'About', exact: true }).click()
  const editor = page.getByRole('textbox', { name: 'Project details', exact: true })
  const text = 'Keep this introduction. Run npm test before saving. Keep this conclusion.'
  await editor.fill(text)
  await expect(editor).toHaveText(text)
  // Select the middle sentence with the keyboard, then use the real toolbar.
  await editor.click()
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+ArrowUp' : 'Control+Home')
  for (let index = 0; index < 'Keep this introduction. '.length; index++) await page.keyboard.press('ArrowRight')
  await page.keyboard.down('Shift')
  for (let index = 0; index < 'Run npm test before saving.'.length; index++) await page.keyboard.press('ArrowRight')
  await page.keyboard.up('Shift')
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe('Run npm test before saving.')
  await page.screenshot({ path: testInfo.outputPath('01-selected-text.png') })
  await page.getByRole('button', { name: 'Code block', exact: true }).click()
  await expect(editor.locator('pre')).toHaveText('Run npm test before saving.')
  expect(await editor.locator('p').allTextContents()).toEqual(['Keep this introduction. ', ' Keep this conclusion.'])
  await page.screenshot({ path: testInfo.outputPath('02-selected-code-block.png') })
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('tabpanel', { name: 'About' }).getByRole('status')).toHaveText('All changes saved')
  await page.reload()
  await expect(editor.locator('pre')).toHaveText('Run npm test before saving.')
  await expect(editor.locator('p')).toHaveText(['Keep this introduction.', 'Keep this conclusion.'])
})
