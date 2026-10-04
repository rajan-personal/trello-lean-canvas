import { expect, test, type Page } from '@playwright/test'
import { servePwaBuild } from './support/pwa-server'

test.use({ viewport: { width: 390, height: 844 } })
let server: Awaited<ReturnType<typeof servePwaBuild>>
test.beforeEach(async () => { server = await servePwaBuild() })
test.afterEach(async () => { await server.close() })
const release = (page: Page) => page.locator('meta[name="test-release"]')
const prompt = (page: Page) => page.getByRole('region', { name: 'App update' })
async function open(page: Page) {
  await page.goto(server.url)
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
}
async function deploy(page: Page) {
  server.deploy()
  await page.evaluate(async () => { await (await navigator.serviceWorker.ready).update() })
  await expect(prompt(page)).toBeVisible()
}

test('mobile update waits for consent, supports Later, and retains offline storage', async ({ page, context }) => {
  await open(page)
  await page.evaluate(() => { localStorage.setItem('pwa-test-draft', 'saved draft') })
  await deploy(page)
  await expect(release(page)).toHaveAttribute('content', 'a')
  const box = await prompt(page).boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(390)
  await prompt(page).getByRole('button', { name: 'Later' }).click()
  await expect(prompt(page)).toBeHidden()
  await expect(release(page)).toHaveAttribute('content', 'a')
  await page.reload()
  await expect(prompt(page)).toBeVisible()
  await prompt(page).getByRole('button', { name: 'Update', exact: true }).click()
  await expect(release(page)).toHaveAttribute('content', 'b')
  await expect(prompt(page)).toBeHidden()
  expect(await page.evaluate(() => localStorage.getItem('pwa-test-draft'))).toBe('saved draft')
  await context.setOffline(true)
  await page.reload()
  await expect(release(page)).toHaveAttribute('content', 'b')
  await expect(page.locator('#root')).not.toBeEmpty()
})

test('updating one tab does not reload another tab with unfinished edits', async ({ page, context }) => {
  await open(page)
  const other = await context.newPage()
  await open(other)
  await other.evaluate(() => {
    const draft = document.createElement('textarea')
    draft.id = 'unsaved-draft'
    draft.value = 'unfinished edit'
    document.body.append(draft)
  })
  await deploy(page)
  await expect(prompt(other)).toBeVisible()
  await prompt(page).getByRole('button', { name: 'Update', exact: true }).click()
  await expect(release(page)).toHaveAttribute('content', 'b')
  await expect(release(other)).toHaveAttribute('content', 'a')
  await expect(other.locator('#unsaved-draft')).toHaveValue('unfinished edit')
  await prompt(other).getByRole('button', { name: 'Update', exact: true }).click()
  await expect(release(other)).toHaveAttribute('content', 'b')
})
