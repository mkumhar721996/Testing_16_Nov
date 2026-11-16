import { expect, test } from '@playwright/test'

test('partner marks an item sold out and sees a refusal', async ({ page }) => {
  let available = true
  await page.route('**/partner/items', (route) =>
    route.fulfill({ json: [{ id: 'i1', name: 'Onion bhaji', available }] }),
  )
  await page.route('**/partner/items/i1/availability', async (route) => {
    available = route.request().postDataJSON().available
    await route.fulfill({ json: { id: 'i1', name: 'Onion bhaji', available } })
  })
  await page.goto('/')
  await page.getByRole('switch', { name: 'Onion bhaji available' }).click()
  await expect(page.getByText('Sold out')).toBeVisible()

  await page.route('**/partner/items/i1/availability', (route) => route.fulfill({ status: 403, json: {} }))
  await page.getByRole('switch', { name: 'Onion bhaji available' }).click()
  await expect(page.getByText(/Change refused/)).toBeVisible()
})
