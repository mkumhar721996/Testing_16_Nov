import { test, expect } from '@playwright/test'

test('home page shows heading', async ({ page }) => {
  await page.route('**/partner/items', (route) => route.fulfill({ json: [] }))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Availability' })).toBeVisible()
})
