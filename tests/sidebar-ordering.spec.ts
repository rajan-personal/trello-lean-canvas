import { expect, test } from '@playwright/test'
import { loadSamples } from './support/canvas-fixtures'

test('shows favorited canvases in the sidebar', async ({ page }) => {
  await loadSamples(page)

  const favoriteButton = page.getByRole('button', { name: 'Favorite canvas' })
  const airbnbSidebarItem = page
    .getByRole('navigation', { name: 'Lean canvases' })
    .getByRole('button', { name: 'Airbnb', exact: true })

  await expect(airbnbSidebarItem.locator('.canvas-nav-favorite')).toHaveCount(0)
  await favoriteButton.click()
  await expect(favoriteButton).toHaveAttribute('aria-pressed', 'true')
  await expect(airbnbSidebarItem.locator('.canvas-nav-favorite')).toBeVisible()

  await page.getByRole('button', { name: 'Facebook', exact: true }).click()
  await expect(airbnbSidebarItem.locator('.canvas-nav-favorite')).toBeVisible()
})

test('reorders sidebar canvases with drag and drop and persists the order', async ({
  page,
}) => {
  await loadSamples(page)

  const navigation = page.getByRole('navigation', { name: 'Lean canvases' })
  const airbnb = navigation.getByRole('button', {
    name: 'Airbnb',
    exact: true,
  })
  const facebook = navigation.getByRole('button', {
    name: 'Facebook',
    exact: true,
  })
  const facebookBox = await facebook.boundingBox()
  expect(facebookBox).not.toBeNull()

  await airbnb.dragTo(facebook, {
    targetPosition: { x: 20, y: facebookBox!.height - 2 },
  })

  await expect(page.getByRole('status')).toHaveText('Canvas moved')
  await expect(navigation.getByRole('button').nth(0)).toHaveAccessibleName(
    'Facebook',
  )
  await expect(navigation.getByRole('button').nth(1)).toHaveAccessibleName(
    'Airbnb',
  )

  await page.reload()
  await expect(navigation.getByRole('button').nth(0)).toHaveAccessibleName(
    'Facebook',
  )
  await expect(navigation.getByRole('button').nth(1)).toHaveAccessibleName(
    'Airbnb',
  )
})

test('moves a focused sidebar canvas with Alt and arrow keys', async ({
  page,
}) => {
  await loadSamples(page)

  const navigation = page.getByRole('navigation', { name: 'Lean canvases' })
  await navigation
    .getByRole('button', { name: 'Airbnb', exact: true })
    .press('Alt+ArrowDown')

  await expect(navigation.getByRole('button').nth(0)).toHaveAccessibleName(
    'Facebook',
  )
  await expect(navigation.getByRole('button').nth(1)).toHaveAccessibleName(
    'Airbnb',
  )
})
