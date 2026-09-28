import { expect, test } from '@playwright/test'
import { loadSamples } from './support/canvas-fixtures'

test('formats selected text, previews Markdown, and saves the exact source', async ({ page }) => {
  await loadSamples(page)
  await page.getByRole('tab', { name: 'About', exact: true }).click()
  const details = page.getByRole('textbox', { name: 'Project details', exact: true })
  await details.fill('Project overview')
  await details.press('ControlOrMeta+A')
  await page.getByRole('button', { name: 'Add bold text' }).click()
  await expect(details).toHaveValue('**Project overview**')
  const markdown = '# Project overview\n\n**Goals** and *scope*\n\n- Validate demand\n- Talk to hosts\n\n[Project plan](https://example.com/plan)\n\n```js\nconst hosts = 3\n```'
  await details.fill(markdown)
  await page.getByRole('button', { name: 'Preview', exact: true }).click()
  const preview = page.getByRole('region', { name: 'Project details preview' })
  await expect(preview.getByRole('heading', { name: 'Project overview' })).toBeVisible()
  await expect(preview.locator('strong')).toHaveText('Goals')
  await expect(preview.getByRole('listitem')).toHaveCount(2)
  await expect(preview.getByRole('link', { name: 'Project plan' })).toHaveAttribute('href', 'https://example.com/plan')
  await expect(preview.locator('pre')).toContainText('const hosts = 3')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('lean-canvas:v2')!)[0].about)).toBe('')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('tabpanel', { name: 'About' }).getByRole('status')).toHaveText('All changes saved')
  await page.reload()
  await expect(details).toHaveValue(markdown)
  await details.press('Tab')
  await expect(details).not.toBeFocused()
})

test('preview strips unsafe HTML and link protocols without changing the source', async ({ page }) => {
  await loadSamples(page)
  await page.getByRole('tab', { name: 'About', exact: true }).click()
  const details = page.getByRole('textbox', { name: 'Project details', exact: true })
  const source = '# Safe heading\n\n<script>window.markdownExecuted = true</script>\n\n<img src=x onerror="window.markdownExecuted = true">\n\n[Unsafe](javascript:alert%281%29)'
  await details.fill(source)
  await page.getByRole('button', { name: 'Preview', exact: true }).click()
  const preview = page.getByRole('region', { name: 'Project details preview' })
  await expect(preview.getByRole('heading', { name: 'Safe heading' })).toBeVisible()
  await expect(preview.locator('script, iframe, img, [onerror], [href^="javascript:"]')).toHaveCount(0)
  expect(await page.evaluate(() => Reflect.get(window, 'markdownExecuted'))).toBeUndefined()
  await page.getByRole('button', { name: 'Write', exact: true }).click()
  await expect(details).toHaveValue(source)
})

test('editor controls and preview fit on a small phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await loadSamples(page)
  await page.getByRole('tab', { name: 'About', exact: true }).click()
  await page.getByRole('textbox', { name: 'Project details', exact: true }).fill('# Goals\n\n' + 'long-link'.repeat(80))
  for (const button of await page.locator('.project-markdown-editor button').all()) {
    if (!await button.isVisible()) continue
    const bounds = await button.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320)
  }
  await page.getByRole('button', { name: 'Preview', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Project details preview' }).getByRole('heading')).toHaveText('Goals')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
  await page.getByRole('button', { name: 'Write', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Project details', exact: true })).toHaveValue(/^# Goals/)
})
