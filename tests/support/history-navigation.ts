import type { Page } from '@playwright/test'

/** Wait for the actual guard decision, not just the pre-navigation URL. */
export async function answerHistoryNavigation(page: Page, delta: number, accept: boolean) {
  const prompt = page.waitForEvent('dialog')
  await page.evaluate((delta) => history.go(delta), delta)
  const dialog = await prompt
  if (accept) await dialog.accept()
  else await dialog.dismiss()
}
