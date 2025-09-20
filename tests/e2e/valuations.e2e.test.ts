/**
 * End-to-End Test Scenarios for 409A Valuation Platform
 *
 * These tests simulate complete user workflows through the application
 * Note: Requires test database and server to be running
 */

import { test, expect } from '@playwright/test'

// Test configuration
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

test.describe('409A Valuation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto(BASE_URL)
  })

  test.describe('Valuation Creation Workflow', () => {
    test('should create a new valuation from start to finish', async ({ page }) => {
      // Step 1: Navigate to valuations page
      await page.click('text=Valuations')
      await expect(page).toHaveURL(/.*\/valuations/)

      // Step 2: Click create new valuation
      await page.click('button:has-text("New Valuation")')
      await expect(page).toHaveURL(/.*\/valuations\/new/)

      // Step 3: Fill in company information
      await page.selectOption('select[name="company_id"]', { label: 'Test Company Inc.' })
      await page.fill('input[name="valuation_date"]', '2024-03-01')
      await page.selectOption('select[name="status"]', 'draft')

      // Step 4: Navigate to assumptions tab
      await page.click('text=Assumptions')

      // Step 5: Fill in key assumptions
      await page.fill('input[name="current_year_revenue"]', '5000000')
      await page.fill('input[name="revenue_growth_rate"]', '0.25')
      await page.fill('input[name="ebitda_margin"]', '0.15')
      await page.fill('input[name="discount_rate"]', '0.12')
      await page.fill('input[name="terminal_growth_rate"]', '0.03')

      // Step 6: Navigate to cap table tab
      await page.click('text=Cap Table')

      // Step 7: Add share classes
      await page.click('button:has-text("Add Share Class")')
      await page.fill('input[name="shareClassName"]', 'Common Stock')
      await page.fill('input[name="sharesOutstanding"]', '10000000')
      await page.fill('input[name="pricePerShare"]', '0.01')
      await page.click('button:has-text("Save Share Class")')

      // Step 8: Save valuation
      await page.click('button:has-text("Save Valuation")')

      // Verify success message
      await expect(page.locator('text=Valuation saved successfully')).toBeVisible()

      // Verify redirect to valuation detail page
      await expect(page).toHaveURL(/.*\/valuations\/[\w-]+/)
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto(`${BASE_URL}/valuations/new`)

      // Try to save without required fields
      await page.click('button:has-text("Save Valuation")')

      // Check for validation errors
      await expect(page.locator('text=Company is required')).toBeVisible()
      await expect(page.locator('text=Valuation date is required')).toBeVisible()
    })
  })

  test.describe('Cap Table Management', () => {
    test('should manage cap table entries', async ({ page }) => {
      // Navigate to existing valuation
      await page.goto(`${BASE_URL}/valuations`)
      await page.click('tr:first-child') // Click first valuation

      // Navigate to cap table
      await page.click('text=Cap Table')

      // Add new share class
      await page.click('button:has-text("Add Share Class")')

      // Fill in preferred share details
      await page.selectOption('select[name="shareType"]', 'preferred')
      await page.fill('input[name="shareClassName"]', 'Series A')
      await page.fill('input[name="sharesOutstanding"]', '2000000')
      await page.fill('input[name="pricePerShare"]', '1.00')
      await page.fill('input[name="lpMultiple"]', '1')

      await page.click('button:has-text("Save")')

      // Verify share class was added
      await expect(page.locator('text=Series A')).toBeVisible()

      // Edit share class
      await page.click('button[aria-label="Edit Series A"]')
      await page.fill('input[name="sharesOutstanding"]', '2500000')
      await page.click('button:has-text("Update")')

      // Verify update
      await expect(page.locator('text=2,500,000')).toBeVisible()

      // Delete share class
      await page.click('button[aria-label="Delete Series A"]')
      await page.click('button:has-text("Confirm Delete")')

      // Verify deletion
      await expect(page.locator('text=Series A')).not.toBeVisible()
    })
  })

  test.describe('Waterfall Analysis', () => {
    test('should calculate waterfall distribution', async ({ page }) => {
      // Navigate to valuation with existing cap table
      await page.goto(`${BASE_URL}/valuations/test-valuation-id`)

      // Navigate to waterfall tab
      await page.click('text=Waterfall')

      // Enter exit value
      await page.fill('input[name="exit_value"]', '50000000')
      await page.click('button:has-text("Calculate")')

      // Verify waterfall results appear
      await expect(page.locator('text=Distribution Summary')).toBeVisible()
      await expect(page.locator('table.waterfall-results')).toBeVisible()

      // Verify chart renders
      await expect(page.locator('canvas#waterfall-chart')).toBeVisible()

      // Test different scenarios
      await page.fill('input[name="exit_value"]', '100000000')
      await page.click('button:has-text("Recalculate")')

      // Verify updated results
      await expect(page.locator('text=Total Distributed: $100,000,000')).toBeVisible()
    })
  })

  test.describe('Breakpoints Analysis', () => {
    test('should generate breakpoint analysis', async ({ page }) => {
      await page.goto(`${BASE_URL}/valuations/test-valuation-id`)
      await page.click('text=Breakpoints')

      // Set valuation ranges
      await page.fill('input[name="min_valuation"]', '10000000')
      await page.fill('input[name="max_valuation"]', '100000000')
      await page.fill('input[name="step"]', '10000000')

      await page.click('button:has-text("Generate Analysis")')

      // Verify breakpoint table
      await expect(page.locator('table.breakpoints-table')).toBeVisible()

      // Verify ownership percentages update
      await expect(page.locator('th:has-text("$10,000,000")')).toBeVisible()
      await expect(page.locator('th:has-text("$100,000,000")')).toBeVisible()

      // Export results
      await page.click('button:has-text("Export to Excel")')

      // Verify download started
      const download = await page.waitForEvent('download')
      expect(download.suggestedFilename()).toContain('breakpoints')
    })
  })

  test.describe('Report Generation', () => {
    test('should generate 409A report', async ({ page }) => {
      await page.goto(`${BASE_URL}/valuations/test-valuation-id`)

      // Navigate to reports section
      await page.click('text=Generate Report')

      // Select report template
      await page.selectOption('select[name="template"]', 'standard_409a')

      // Configure report options
      await page.check('input[name="include_assumptions"]')
      await page.check('input[name="include_cap_table"]')
      await page.check('input[name="include_waterfall"]')
      await page.check('input[name="include_dlom"]')

      // Generate report
      await page.click('button:has-text("Generate PDF")')

      // Wait for generation
      await expect(page.locator('text=Generating report...')).toBeVisible()

      // Wait for completion
      await expect(page.locator('text=Report generated successfully')).toBeVisible({
        timeout: 30000
      })

      // Verify download
      const download = await page.waitForEvent('download')
      expect(download.suggestedFilename()).toContain('409A_Report')
      expect(download.suggestedFilename()).toContain('.pdf')
    })
  })

  test.describe('Search and Filter', () => {
    test('should search and filter valuations', async ({ page }) => {
      await page.goto(`${BASE_URL}/valuations`)

      // Search by company name
      await page.fill('input[placeholder="Search valuations..."]', 'Tech Corp')
      await page.waitForTimeout(500) // Debounce delay

      // Verify filtered results
      await expect(page.locator('text=Tech Corp')).toBeVisible()
      await expect(page.locator('text=Other Company')).not.toBeVisible()

      // Clear search
      await page.fill('input[placeholder="Search valuations..."]', '')

      // Filter by status
      await page.selectOption('select[name="status_filter"]', 'completed')

      // Verify only completed valuations shown
      const statusBadges = page.locator('.status-badge')
      const count = await statusBadges.count()
      for (let i = 0; i < count; i++) {
        await expect(statusBadges.nth(i)).toHaveText('Completed')
      }

      // Filter by date range
      await page.fill('input[name="date_from"]', '2024-01-01')
      await page.fill('input[name="date_to"]', '2024-12-31')
      await page.click('button:has-text("Apply Filters")')

      // Verify date filtering
      await expect(page.locator('text=No valuations found')).not.toBeVisible()
    })
  })

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 812 })

      await page.goto(`${BASE_URL}/valuations`)

      // Check mobile menu
      await page.click('button[aria-label="Menu"]')
      await expect(page.locator('nav.mobile-menu')).toBeVisible()

      // Navigate using mobile menu
      await page.click('text=Companies')
      await expect(page).toHaveURL(/.*\/companies/)

      // Check responsive table
      await page.goto(`${BASE_URL}/valuations`)

      // Verify mobile-friendly view
      await expect(page.locator('.mobile-card-view')).toBeVisible()
    })

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })

      await page.goto(`${BASE_URL}/valuations/test-id`)

      // Verify tablet layout
      await expect(page.locator('.tablet-sidebar')).toBeVisible()

      // Test touch interactions
      await page.locator('.tab-button').first().tap()
      await expect(page.locator('.tab-content')).toBeVisible()
    })
  })

  test.describe('Performance', () => {
    test('should load valuations list quickly', async ({ page }) => {
      const startTime = Date.now()

      await page.goto(`${BASE_URL}/valuations`)
      await page.waitForSelector('table')

      const loadTime = Date.now() - startTime

      // Page should load in under 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })

    test('should handle large datasets', async ({ page }) => {
      // Navigate to test page with large dataset
      await page.goto(`${BASE_URL}/valuations?test_mode=large_dataset`)

      // Verify virtual scrolling is active
      await expect(page.locator('.virtual-scroll-container')).toBeVisible()

      // Scroll and verify lazy loading
      await page.evaluate(() => window.scrollBy(0, 5000))
      await page.waitForTimeout(500)

      // Verify new items loaded
      const visibleRows = await page.locator('tr:visible').count()
      expect(visibleRows).toBeGreaterThan(0)
      expect(visibleRows).toBeLessThan(100) // Virtual scrolling limits visible rows
    })
  })

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page, context }) => {
      // Simulate offline mode
      await context.setOffline(true)

      await page.goto(`${BASE_URL}/valuations`)

      // Verify error message
      await expect(page.locator('text=Unable to connect')).toBeVisible()

      // Verify retry button
      await expect(page.locator('button:has-text("Retry")')).toBeVisible()

      // Go back online and retry
      await context.setOffline(false)
      await page.click('button:has-text("Retry")')

      // Verify recovery
      await expect(page.locator('table')).toBeVisible()
    })

    test('should handle API errors', async ({ page }) => {
      // Navigate to page that will trigger API error
      await page.goto(`${BASE_URL}/valuations/invalid-id`)

      // Verify 404 error handling
      await expect(page.locator('text=Valuation not found')).toBeVisible()
      await expect(page.locator('a:has-text("Back to Valuations")')).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto(`${BASE_URL}/valuations`)

      // Tab through interactive elements
      await page.keyboard.press('Tab')
      await expect(page.locator('a:focus')).toBeVisible()

      // Navigate with arrow keys in table
      await page.locator('table').focus()
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')

      // Verify navigation worked
      await expect(page).toHaveURL(/.*\/valuations\/[\w-]+/)
    })

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto(`${BASE_URL}/valuations`)

      // Check main navigation
      const nav = page.locator('nav[aria-label="Main navigation"]')
      await expect(nav).toBeVisible()

      // Check form labels
      await page.goto(`${BASE_URL}/valuations/new`)

      const companySelect = page.locator('select[aria-label="Select company"]')
      await expect(companySelect).toBeVisible()

      // Check loading states
      await page.click('button:has-text("Save")')
      await expect(page.locator('[aria-busy="true"]')).toBeVisible()
    })
  })
})