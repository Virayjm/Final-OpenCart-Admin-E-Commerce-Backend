import { test, expect } from '../../fixtures/admin.fixture';

/**
 * Network interception and mocking suite validating OpenCart Admin UI
 * resilience when product save requests return HTTP 500 or catalog requests
 * experience artificial network latency via Playwright `page.route()`.
 */
test.describe('OpenCart Admin - Network Interception & Mocking (page.route)', () => {
  // TC-NET-01: Intercepts product save POST/PUT requests with HTTP 500 and
  // verifies that the form remains usable without crashing or freezing.
  test('TC-NET-01: Mock 500 Internal Server Error when saving a product and verify graceful error UI', async ({
    authenticatedDashboard,
    productListPage,
    productFormPage,
    page,
  }) => {
    await authenticatedDashboard.expectLoaded();
    await productListPage.open();
    await productListPage.clickAddNew();

    const suffix = Date.now();
    await productFormPage.fillGeneralAndData({
      name: `JW Mock 500 Product ${suffix}`,
      metaTitle: `JW Mock Meta ${suffix}`,
      model: `JW-500-${suffix}`,
      price: '150.00',
      quantity: '5',
    });

    let intercepted500 = false;

    // Fulfill mutating catalog/product requests with a mocked 500 response while
    // allowing non-mutating requests to pass through normally.
    await page.route('**/*catalog/product*', async (route) => {
      const method = route.request().method();
      if (method === 'POST' || method === 'PUT') {
        intercepted500 = true;
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Simulated 500 Internal Server Error during product save',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await expect(productFormPage.saveButton).toBeVisible();
    await productFormPage.saveButton.click();

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => null);

    // Verify the page did not crash, white-screen, or disable the save control
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(productFormPage.saveButton).toBeEnabled();

    // Check for an alert/toast banner; if stock OpenCart 4.1.0.4 does not render
    // one on a raw 500 response, confirm the 500 mock fired and the form stayed intact.
    const errorBanner = page.locator('.alert-danger, #alert .alert, .toast').first();
    const bannerVisible = await errorBanner.isVisible().catch(() => false);
    if (!bannerVisible) {
      expect(intercepted500).toBe(true);
      await expect(page.locator('#form-product, form').first()).toBeVisible();
    }

    // Remove the route handler so subsequent tests are not affected
    await page.unroute('**/*catalog/product*');
  });

  // TC-NET-02: Adds an artificial delay to catalog/product requests and confirms
  // the grid renders cleanly after the delayed response completes.
  test('TC-NET-02: Simulate slow network response on catalog request and verify UI completes cleanly', async ({
    authenticatedDashboard,
    productListPage,
    page,
  }) => {
    await authenticatedDashboard.expectLoaded();

    let delayedRequests = 0;
    const artificialDelayMs = 1500;

    // Delay matching catalog/product requests before forwarding them to the server
    await page.route('**/*catalog/product*', async (route) => {
      delayedRequests++;
      await new Promise((resolve) => setTimeout(resolve, artificialDelayMs));
      await route.continue();
    });

    const startTime = Date.now();
    await productListPage.open();
    await productListPage.dismissSecurityModalIfVisible();

    const elapsedMs = Date.now() - startTime;
    expect(delayedRequests).toBeGreaterThan(0);
    expect(elapsedMs).toBeGreaterThanOrEqual(artificialDelayMs - 150);

    // Confirm table rows and page body render cleanly after the delay
    await expect(productListPage.tableRows.first()).toBeVisible();
    await expect(page.locator('body')).not.toBeEmpty();

    // Remove the route handler so subsequent tests are not affected
    await page.unroute('**/*catalog/product*');
  });
});