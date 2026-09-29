import { expect, test } from '@playwright/test'
import { loadSamples } from './support/canvas-fixtures'

test.beforeEach(async ({ page }) => {
  // These checks use the system monospace stack, not the remote body font.
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort())
})

test('code controls distinguish snippets from blocks and preserve edits on reload', async ({ page }) => {
  await loadSamples(page)
  await page.getByRole('tab', { name: 'About', exact: true }).click()
  const details = page.getByRole('textbox', { name: 'Project details', exact: true })
  const inline = page.getByRole('button', { name: 'Inline code', exact: true })
  const block = page.getByRole('button', { name: 'Code block', exact: true })
  await expect(inline).toHaveText('Inline code')
  await expect(block).toHaveText('Code block')
  await details.fill('methods: get, edit, add_comments')
  await details.press('ControlOrMeta+A')
  await inline.click()
  await expect(details.locator('p > code')).toHaveText('methods: get, edit, add_comments')
  await expect(inline).toHaveAttribute('aria-pressed', 'true')
  await block.click()
  await expect(details.locator('pre > code')).toHaveText('methods: get, edit, add_comments')
  await expect(block).toHaveAttribute('aria-pressed', 'true')
  await expect(inline).toBeDisabled()
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'All changes saved' })).toBeVisible()
  await page.reload()
  await expect(details.locator('pre > code')).toHaveText('methods: get, edit, add_comments')
  await details.locator('pre').click()
  await block.click()
  await expect(details.locator('pre')).toHaveCount(0)
  await expect(inline).toBeEnabled()
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(details.locator('pre > code')).toHaveText('methods: get, edit, add_comments')
})

for (const surface of ['About', 'Notepad'] as const) {
  test(`${surface} keeps long code lines inside the editor at desktop and phone widths`, async ({ page }) => {
    await loadSamples(page)
    const longLine = `schema:    ${'project_id, title, description, status, storypoints, comments, '.repeat(8)}`
    const markdown = ['**MCP**', '`projects` and `tickets`', '```text', 'methods:   create, get, list, update, del', longLine, '```'].join('\n\n')
    await page.evaluate(({ surface, markdown }) => {
      const canvases = JSON.parse(localStorage.getItem('lean-canvas:v2')!)
      canvases[0][surface === 'About' ? 'about' : 'notes'] = markdown
      localStorage.setItem('lean-canvas:v2', JSON.stringify(canvases))
    }, { surface, markdown })
    await page.reload()
    if (surface === 'About') await page.getByRole('tab', { name: 'About', exact: true }).click()
    else await page.getByRole('button', { name: 'Notepad', exact: true }).click()
    const editor = page.getByRole('textbox', { name: surface === 'About' ? 'Project details' : 'Canvas notes', exact: true })
    await expect(editor.locator('pre')).toContainText(longLine)
    for (const width of [1440, 320]) {
      await page.setViewportSize({ width, height: 900 })
      const metrics = await editor.evaluate((element) => {
        const block = element.querySelector('pre')!
        const inlineStyle = getComputedStyle(element.querySelector('p code')!)
        const blockStyle = getComputedStyle(block.querySelector('code')!)
        return {
          pageWidth: document.documentElement.scrollWidth,
          editorWidth: element.clientWidth,
          editorScrollWidth: element.scrollWidth,
          blockWidth: block.clientWidth,
          blockScrollWidth: block.scrollWidth,
          blockWhiteSpace: blockStyle.whiteSpace,
          inlineFont: [inlineStyle.fontFamily, inlineStyle.fontSize],
          blockFont: [blockStyle.fontFamily, blockStyle.fontSize],
        }
      })
      expect(metrics.pageWidth).toBe(width)
      expect(metrics.editorScrollWidth).toBe(metrics.editorWidth)
      expect(metrics.blockScrollWidth).toBeGreaterThan(metrics.blockWidth)
      expect(metrics.blockWhiteSpace).toBe('pre')
      expect(metrics.inlineFont).toEqual(metrics.blockFont)
      const container = editor.locator('xpath=ancestor::div[contains(@class, "project-rich-text-editor")]')
      for (const button of await container.getByRole('button').all()) {
        const bounds = await button.boundingBox()
        expect(bounds!.x).toBeGreaterThanOrEqual(0)
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
      }
    }
    const stored = await page.evaluate((surface) => JSON.parse(localStorage.getItem('lean-canvas:v2')!)[0][surface === 'About' ? 'about' : 'notes'], surface)
    expect(stored).toBe(markdown)
  })
}
