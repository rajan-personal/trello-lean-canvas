import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import process from 'node:process'
import console from 'node:console'
import { setTimeout } from 'node:timers/promises'
import { chromium, expect } from '@playwright/test'

const { fetch } = globalThis
const port = 6014
const server = spawn('node_modules/.bin/storybook', ['dev', '--ci', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' })
const base = `http://127.0.0.1:${port}`
let browser
try {
  let ready = false
  for (let attempt = 0; attempt < 120; attempt++) {
    try { if ((await fetch(`${base}/index.json`)).ok) { ready = true; break } } catch { /* starting */ }
    if (server.exitCode !== null) throw new Error('Storybook failed to start')
    await setTimeout(250)
  }
  if (!ready) throw new Error('Storybook startup timed out')
  browser = await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox', '--single-process', '--disable-gpu'],
  } : {})
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort())
  const open = async (story) => {
    await page.goto(`${base}/iframe.html?id=kanban-codex-run--${story}&viewMode=story`, { waitUntil: 'networkidle' })
    await expect(page.getByRole('region', { name: 'Codex', exact: true })).toBeVisible()
  }
  await mkdir('docs/pr-proofs/codex-runs', { recursive: true })
  for (const story of ['mobile-ready', 'mobile-running', 'mobile-result']) {
    await open(story)
    await page.locator('textarea[name="title"]').blur()
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 })
      const panel = page.getByRole('region', { name: 'Codex', exact: true })
      const box = await panel.boundingBox()
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(width)
      expect(await page.getByRole('dialog').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
      const action = panel.getByRole('button')
      expect((await action.boundingBox()).height).toBeGreaterThanOrEqual(44)
    }
    await page.getByRole('dialog').evaluate((el) => { el.scrollTop = 0 })
    await page.screenshot({ path: `docs/pr-proofs/codex-runs/${story}.png` })
  }
  await expect(page.getByRole('link', { name: 'View pull request' })).toHaveAttribute('href', 'https://github.com/rajan-personal/trello-lean-canvas/pull/28')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.screenshot({ path: 'docs/pr-proofs/codex-runs/desktop-result.png' })
  await page.setViewportSize({ width: 390, height: 844 })
  await open('disconnected')
  await expect(page.getByRole('button', { name: 'Run Codex' })).toBeDisabled()
  await open('blocked')
  await expect(page.getByRole('button', { name: 'Needs input', exact: true })).toBeDisabled()
  await open('stale')
  await expect(page.getByText('No recent update. Check the run in Work.')).toBeVisible()
  await open('ready')
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Unsaved change')
  await expect(page.getByRole('button', { name: 'Run Codex' })).toBeDisabled()
  await expect(page.getByText('Save your changes before running Codex.')).toBeVisible()
  await open('ready')
  await page.getByRole('button', { name: 'Run Codex' }).click()
  await expect(page.getByRole('button', { name: 'Queued', exact: true })).toBeDisabled()
  await expect(page.getByText('Waiting for Work to pick up this ticket.')).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Status', exact: true })).toHaveText('Backlog')
  await open('request-failure')
  // The story's play function exercises request failure and retry automatically.
  await expect(page.getByRole('button', { name: 'Run Codex' })).toBeEnabled()
  await page.getByRole('button', { name: 'Run Codex' }).click()
  await expect(page.getByRole('alert')).toContainText('Couldn’t queue this run. Try again.')
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Run Codex' })).toBeEnabled()
  console.log('PASS: mobile 320/390 layout, 44px controls, queue, draft guard, disconnected, blocked, stale, failure/retry, result link; 4 screenshots saved.')
} finally {
  if (browser) await browser.close()
  server.kill()
}
