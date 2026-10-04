import { expect, test } from '@playwright/test'
import { boards, openList, projects, recentActivity } from './support/ticket-list'

test('shows only active tickets with distinct status cues and opens the exact ticket', async ({ page }) => {
  await openList(page)
  const tickets = page.locator('.ticket-active-open')
  await expect(tickets).toHaveText(['Build release', 'Duplicate title', 'Duplicate title', 'Build this', 'Review this'])
  const reviewPill = page.locator('.ticket-active-review .ticket-status-pill').first()
  expect(await reviewPill.evaluate((node) => getComputedStyle(node, '::after').content)).toBe('"In Review"')
  await expect(page.getByRole('list', { name: 'Active tickets by status' }).getByRole('listitem')).toHaveText(['Todo1', 'In Progress1', 'In Review3'])
  await expect(page.locator('.ticket-active-in-progress .ticket-active-icon')).toHaveCSS('animation-name', 'ticket-active-spin')
  await expect(page.getByText('No active tickets.', { exact: true })).toBeVisible()
  const review = page.getByRole('button', { name: 'Duplicate title, In Review', exact: true }).first()
  await review.focus()
  await expect(review).toHaveCSS('outline-style', 'solid')
  await review.press('Enter')
  await expect(page).toHaveURL('/project/a/ticket/a-duplicate-first')
  await expect(page.getByRole('dialog', { name: 'Card details' })).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL('/tickets')
  await expect(page.locator('.ticket-active-open')).toHaveCount(5)
})

test('updates visible tickets and counts when a ticket moves out of an active status', async ({ page }) => {
  await openList(page)
  await page.evaluate((seed) => {
    seed.a.cards = seed.a.cards.filter(({ id }) => id !== 'a-running')
    localStorage.setItem('lean-canvas:boards:v1', JSON.stringify(seed))
    window.dispatchEvent(new Event('storage'))
  }, boards)
  await expect(page.getByRole('button', { name: 'Build release, In Progress', exact: true })).toHaveCount(0)
  await expect(page.getByRole('list', { name: 'Active tickets for Alpha project' }).getByRole('button')).toHaveCount(2)
})

test('stops the working animation when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openList(page)
  await expect(page.locator('.ticket-active-in-progress .ticket-active-icon')).toHaveCSS('animation-name', 'none')
  await expect(page.getByRole('button', { name: 'Build release, In Progress', exact: true })).toBeVisible()
})

for (const width of [320, 390]) {
  test(`wraps long ticket titles without overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    const title = 'LongTicketTitleWithoutSpaces'.repeat(6)
    await openList(page, { projects, boards: { ...boards, b: { ...boards.b, cards: [...boards.b.cards,
      { id: 'long', columnId: 'todo', title, description: '', rank: 'b' },
    ] } } })
    const ticket = page.getByRole('button', { name: `${title}, Todo`, exact: true })
    await ticket.scrollIntoViewIfNeeded()
    await expect(ticket).toBeInViewport()
    expect(await page.locator('.ticket-list-area').evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true)
    expect(await page.locator('body').evaluate(node => node.scrollWidth)).toBeLessThanOrEqual(width)
    await ticket.click()
    await expect(page).toHaveURL('/project/b/ticket/long')
  })
}

for (const width of [390, 1440]) {
  test(`captures active ticket list at ${width}px`, async ({ browser }, testInfo) => {
    const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 760, hasTouch: width < 760 })
    try {
      const names = ['Lean Canvas', 'Mysave', 'Ideas']
      const screenshotProjects = projects.map((project, index) => ({ ...project, name: names[index], title: names[index] }))
      const columns = ['backlog', 'todo', 'in-progress', 'review', 'done', 'closed'].map(id => ({ id, title: id }))
      const cards = (entries: [string, string][]) => entries.map(([columnId, title], index) => ({ id: `task-${index}`, columnId, title, description: '', rank: String.fromCharCode(97 + index) }))
      await openList(page, { projects: screenshotProjects, boards: {
        a: { columns, cards: cards([
          ['todo', 'Add project search'], ['in-progress', 'Keep editor tools in one row on mobile'],
          ['review', 'Google and email login'], ['review', 'Open tickets directly from the list'],
          ['backlog', 'Hidden backlog ticket'], ['done', 'Hidden completed ticket'], ['closed', 'Hidden closed ticket'],
        ]), comments: [], activity: recentActivity },
        b: { columns, cards: cards([
          ['todo', 'Plan shared albums'], ['in-progress', 'Improve photo upload progress'], ['review', 'Review gallery layout'],
        ]), comments: [], activity: recentActivity },
        c: { columns, cards: [], comments: [], activity: recentActivity },
      } })
      await expect(page.locator('.ticket-active-open')).toHaveCount(7)
      await expect(page.getByText(/Hidden .* ticket/)).toHaveCount(0)
      const path = testInfo.outputPath(`active-tickets-${width}.png`)
      await page.screenshot({ path, fullPage: true })
      await testInfo.attach(`Active tickets ${width}px`, { path, contentType: 'image/png' })
    } finally { await page.close() }
  })
}
