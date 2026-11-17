import { test, expect, type Page } from '@playwright/test'

const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

async function mockApi(page: Page) {
  const state = {
    temporarilyClosed: false,
    days: Object.fromEntries(days.map((d) => [d, { slots: [{ opensAt: '18:00', closesAt: '22:00' }] }])),
  }
  const hours = () => ({ city: 'Bogotá', timeZone: 'America/Bogota', ...state })
  await page.route('**/partner/restaurant/opening-hours', async (route) => {
    if (route.request().method() === 'PUT') {
      for (const day of route.request().postDataJSON().days) state.days[day.weekday] = { slots: day.slots }
    }
    await route.fulfill({ json: hours() })
  })
  await page.route('**/partner/restaurant/temporary-closure', async (route) => {
    state.temporarilyClosed = route.request().postDataJSON().closed
    await route.fulfill({ json: hours() })
  })
}

test('partner adds a slot, saves, closes and reopens', async ({ page }) => {
  await mockApi(page)
  await page.goto('/')
  await expect(page.getByText('Bogotá (UTC−05:00)')).toBeVisible()

  await page.getByRole('button', { name: 'Add slot on Monday' }).click()
  await page.getByLabel('Opens').fill('11:00')
  await page.getByLabel('Closes').fill('14:30')
  await page.getByRole('dialog').getByRole('button', { name: 'Add slot' }).click()
  await page.getByRole('button', { name: 'Save hours' }).click()
  await expect(page.getByText('Hours saved.')).toBeVisible()

  await page.reload()
  await expect(page.getByText('11:00 – 14:30')).toBeVisible()

  await page.getByRole('button', { name: 'Temporarily close' }).click()
  await expect(page.getByText(/Restaurant is temporarily closed/)).toBeVisible()
  await page.getByRole('button', { name: 'Reopen restaurant' }).click()
  await expect(page.getByText('Open', { exact: true }).first()).toBeVisible()
})
