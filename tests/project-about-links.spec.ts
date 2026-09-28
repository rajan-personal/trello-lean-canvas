import { expect, test } from '@playwright/test'
import { loadSamples } from './support/canvas-fixtures'

test('adds links to selected text, rejects unsafe URLs, and removes links', async ({ page }) => {
  await loadSamples(page)
  await page.getByRole('tab', { name: 'About', exact: true }).click()
  const details = page.getByRole('textbox', { name: 'Project details', exact: true })
  await details.fill('Project plan')
  await details.press('ControlOrMeta+A')
  await page.getByRole('button', { name: 'Link', exact: true }).click()
  await page.getByRole('textbox', { name: 'Link URL' }).fill('javascript:alert(1)')
  await page.getByRole('button', { name: 'Apply link' }).click()
  await expect(page.getByRole('alert')).toHaveText('Enter an http, https, or mailto URL.')
  await expect(details.getByRole('link')).toHaveCount(0)
  await page.getByRole('textbox', { name: 'Link URL' }).fill('https://example.com/plan')
  await page.getByRole('button', { name: 'Apply link' }).click()
  await expect(details.getByRole('link', { name: 'Project plan' })).toHaveAttribute('href', 'https://example.com/plan')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('tabpanel', { name: 'About' }).getByRole('status')).toHaveText('All changes saved')
  await page.reload()
  await expect(details.getByRole('link', { name: 'Project plan' })).toBeVisible()
  await details.getByRole('link', { name: 'Project plan' }).click()
  await expect(page).toHaveURL(/\/about$/)
  await page.getByRole('button', { name: 'Link', exact: true }).click()
  await page.getByRole('button', { name: 'Remove link' }).click()
  await expect(details.getByRole('link')).toHaveCount(0)
  await expect(details).toHaveText('Project plan')
})

test('unsafe stored content cannot create active scripts or links', async ({ page }) => {
  await loadSamples(page)
  await page.evaluate(() => {
    const canvases = JSON.parse(localStorage.getItem('lean-canvas:v2')!)
    canvases[0].about = '# Safe heading\n\n<script>window.markdownExecuted = true</script>\n\n<img src=x onerror="window.markdownExecuted = true">\n\n[Unsafe](javascript:alert%281%29)'
    localStorage.setItem('lean-canvas:v2', JSON.stringify(canvases))
  })
  await page.reload()
  await page.getByRole('tab', { name: 'About', exact: true }).click()
  const details = page.getByRole('textbox', { name: 'Project details', exact: true })
  await expect(details.getByRole('heading', { name: 'Safe heading' })).toBeVisible()
  await expect(details.locator('script, iframe, img, [onerror], [href^="javascript:"]')).toHaveCount(0)
  expect(await page.evaluate(() => Reflect.get(window, 'markdownExecuted'))).toBeUndefined()
})
