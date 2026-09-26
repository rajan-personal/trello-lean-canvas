import { expect, test } from '@playwright/test'
import { demoEmail, demoPassword, demoProjectId, demoTicketId } from '../../src/demo/demo-data'

const parent = `/project/${demoProjectId}/ticket`
const ticket = `${parent}/${demoTicketId}`

test('demo login, deep links, local edits, refresh and sign-out without Firebase requests', async ({ page }) => {
  const firebaseRequests: string[] = []
  page.on('request', (request) => {
    if (/(firestore|identitytoolkit|securetoken)\.googleapis\.com|firebaseio\.com|firebaseapp\.com/.test(request.url())) firebaseRequests.push(request.url())
  })
  await page.goto(ticket, { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Tickets-first preview' })).toBeVisible()
  await page.getByLabel('Email', { exact: true }).fill(demoEmail)
  await page.getByLabel('Password', { exact: true }).fill('incorrect')
  await page.getByRole('button', { name: 'Sign in to demo' }).click()
  await expect(page.getByRole('alert')).toContainText('Use the sample email and password')
  await page.getByLabel('Password', { exact: true }).fill(demoPassword)
  await page.getByRole('button', { name: 'Sign in to demo' }).click()
  await expect(page).toHaveURL(ticket)
  await expect(page.getByRole('dialog', { name: 'Card details' })).toBeVisible()
  await page.getByLabel('Description', { exact: true }).fill('Preview edit persisted locally')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page).toHaveURL(parent)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('tab')).toHaveText(['Tickets', 'Canvas'])
  await page.goto(ticket, { waitUntil: 'domcontentloaded' })
  await expect(page.getByLabel('Description', { exact: true })).toHaveValue('Preview edit persisted locally')
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await page.getByRole('tab', { name: 'Canvas', exact: true }).click()
  await expect(page).toHaveURL(`/project/${demoProjectId}`)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('tabpanel', { name: 'Canvas' })).toBeVisible()
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(parent)
  await page.getByRole('button', { name: `Sign out ${demoEmail}` }).click()
  await expect(page.getByRole('heading', { name: 'Tickets-first preview' })).toBeVisible()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Tickets-first preview' })).toBeVisible()
  expect(firebaseRequests).toEqual([])
})
