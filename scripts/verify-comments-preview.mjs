import { mkdir } from 'node:fs/promises'
import process from 'node:process'
import console from 'node:console'
import { chromium, expect } from '@playwright/test'

const url = process.env.COMMENTS_PREVIEW_URL
if (!url) throw new Error('Set COMMENTS_PREVIEW_URL to the isolated preview, never production.')
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(url)
  const dialog = page.getByRole('dialog', { name: 'Card details' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.sr-only')).toHaveCSS('position', 'absolute')
  await expect(dialog.getByText('Agent', { exact: true })).toBeVisible()
  await dialog.getByLabel('New comment').fill('Thanks — reviewed by a user.\nReady to test!')
  await dialog.getByRole('button', { name: 'Add comment' }).click()
  await expect(dialog.getByLabel('New comment')).toHaveValue('')
  await expect(dialog.getByText('User', { exact: true })).toBeVisible()
  await page.reload()
  await expect(dialog.locator('.kanban-comments li')).toHaveCount(2)
  await expect(dialog.getByText('Thanks — reviewed by a user. Ready to test!')).toBeVisible()
  await mkdir('docs/pr-proofs/task-comments', { recursive: true })
  await page.screenshot({ path: 'docs/pr-proofs/task-comments/desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await dialog.getByText('Thanks — reviewed by a user. Ready to test!').scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'docs/pr-proofs/task-comments/mobile.png', fullPage: true })
  expect(errors).toEqual([])
  console.log('Hosted HTTPS preview passed: user/agent labels, posting, reload persistence, mobile, no page errors.')
} finally {
  await browser.close()
}
