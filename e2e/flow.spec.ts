import { test, expect } from '@playwright/test'

test.describe('IMEX EzBiz E2E Flows', () => {

  test('Flow 1: Login & Registration/Form Navigation', async ({ page }) => {
    // 1. Visit Login page
    await page.goto('/login')
    await expect(page).toHaveTitle(/Create Next App/i)

    // 2. Select Entrepreneur tab and check inputs
    await page.click('button:has-text("Usahawan")')
    await expect(page.locator('input[type="email"]')).toHaveAttribute('placeholder', 'usahawan1@gmail.com')

    // 3. Register paths navigation
    await page.goto('/register/track')
    await expect(page.locator('body')).toContainText('Pilih Laluan Pendaftaran Anda')

    await page.goto('/register/direct')
    await expect(page.locator('h1')).toContainText('Profil Perniagaan Laluan Terus')

    // 4. Self Assessment page navigation
    await page.goto('/register/direct/self-assessment')
    await expect(page.locator('h1')).toContainText('Penilaian Kendiri Inovasi')
  })

  test('Flow 2: MARA Officer Login & Scout Search Console', async ({ page }) => {
    // 1. Visit MARA Login
    await page.goto('/mara/login')
    await expect(page.locator('body')).toContainText('MARA Talent Scout')

    // 2. Type officer login details (using local dummy mock credentials)
    await page.fill('input[type="email"]', 'mara1@gmail.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // 3. Should redirect to Search Console
    await page.waitForURL('/search')
    await expect(page.locator('h1')).toContainText('Konsol Carian Usahawan')
  })
})
