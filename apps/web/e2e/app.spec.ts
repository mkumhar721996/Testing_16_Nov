import { test, expect } from '@playwright/test'

test('home page shows the Dashboard heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
})
