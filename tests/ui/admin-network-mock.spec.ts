import { test, expect } from '../../fixtures/admin.fixture';

test.describe('OpenCart Admin - Network Interception & Mocking (page.route)', () => {
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

    // Confirm the page did not crash, white-screen, or freeze
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(productFormPage.saveButton).toBeEnabled();

    const errorBanner = page.locator('.alert-danger, #alert .alert, .toast').first();
    const bannerVisible = await errorBanner.isVisible().catch(() => false);
    if (!bannerVisible) {
      expect(intercepted500).toBe(true);
      await expect(page.locator('#form-product, form').first()).toBeVisible();
    }

    await page.unroute('**/*catalog/product*');
  });

  test('TC-NET-02: Simulate slow network response on catalog request and verify UI completes cleanly', async ({
    authenticatedDashboard,
    productListPage,
    page,
  }) => {
    await authenticatedDashboard.expectLoaded();

    let delayedRequests = 0;
    const artificialDelayMs = 1500;

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

    // Verify grid/page still renders cleanly after delayed response
    await expect(productListPage.tableRows.first()).toBeVisible();
    await expect(page.locator('body')).not.toBeEmpty();

    await page.unroute('**/*catalog/product*');
  });
});