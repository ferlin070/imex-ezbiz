# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flow.spec.ts >> IMEX EzBiz E2E Flows >> Flow 2: MARA Officer Login & Scout Search Console
- Location: e2e\flow.spec.ts:26:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/search" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img [ref=e6]
      - heading "MARA Talent Scout" [level=1] [ref=e9]
      - paragraph [ref=e10]: Konsol Carian & Padanan Geran Usahawan i-MARATeCH
    - generic [ref=e11]:
      - generic [ref=e13]:
        - img [ref=e14]
        - paragraph [ref=e16]: E-mel atau kata laluan salah atau tiada kebenaran akses MARA.
      - generic [ref=e17]:
        - generic [ref=e18]:
          - text: E-mel Pegawai
          - generic [ref=e19]:
            - img [ref=e20]
            - textbox "E-mel Pegawai" [ref=e23]:
              - /placeholder: pegawai@mara.gov.my
              - text: mara1@gmail.com
        - generic [ref=e24]:
          - text: Kata Laluan
          - generic [ref=e25]:
            - img [ref=e26]
            - textbox "Kata Laluan" [ref=e29]:
              - /placeholder: ••••••••
              - text: password123
        - button "Log Masuk Portal" [ref=e30] [cursor=pointer]:
          - generic [ref=e31]: Log Masuk Portal
          - img [ref=e32]
    - link "Log masuk sebagai Usahawan atau Panel Juri →" [ref=e35] [cursor=pointer]:
      - /url: /login
  - generic [ref=e40] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e41]:
      - img [ref=e42]
    - generic [ref=e45]:
      - button "Open issues overlay" [ref=e46]:
        - generic [ref=e47]:
          - generic [ref=e48]: "0"
          - generic [ref=e49]: "1"
        - generic [ref=e50]: Issue
      - button "Collapse issues badge" [ref=e51]:
        - img [ref=e52]
  - alert [ref=e54]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('IMEX EzBiz E2E Flows', () => {
  4  | 
  5  |   test('Flow 1: Login & Registration/Form Navigation', async ({ page }) => {
  6  |     // 1. Visit Login page
  7  |     await page.goto('/login')
  8  |     await expect(page).toHaveTitle(/Create Next App/i)
  9  | 
  10 |     // 2. Select Entrepreneur tab and check inputs
  11 |     await page.click('button:has-text("Usahawan")')
  12 |     await expect(page.locator('input[type="email"]')).toHaveAttribute('placeholder', 'usahawan1@gmail.com')
  13 | 
  14 |     // 3. Register paths navigation
  15 |     await page.goto('/register/track')
  16 |     await expect(page.locator('body')).toContainText('Pilih Laluan Pendaftaran Anda')
  17 | 
  18 |     await page.goto('/register/direct')
  19 |     await expect(page.locator('h1')).toContainText('Profil Perniagaan Laluan Terus')
  20 | 
  21 |     // 4. Self Assessment page navigation
  22 |     await page.goto('/register/direct/self-assessment')
  23 |     await expect(page.locator('h1')).toContainText('Penilaian Kendiri Inovasi')
  24 |   })
  25 | 
  26 |   test('Flow 2: MARA Officer Login & Scout Search Console', async ({ page }) => {
  27 |     // 1. Visit MARA Login
  28 |     await page.goto('/mara/login')
  29 |     await expect(page.locator('body')).toContainText('MARA Talent Scout')
  30 | 
  31 |     // 2. Type officer login details (using local dummy mock credentials)
  32 |     await page.fill('input[type="email"]', 'mara1@gmail.com')
  33 |     await page.fill('input[type="password"]', 'password123')
  34 |     await page.click('button[type="submit"]')
  35 | 
  36 |     // 3. Should redirect to Search Console
> 37 |     await page.waitForURL('/search')
     |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  38 |     await expect(page.locator('h1')).toContainText('Konsol Carian Usahawan')
  39 |   })
  40 | })
  41 | 
```