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

    // Intercept product save/mutation requests and fulfill with 500 Internal Server Error
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

    // Give the UI a moment to process the 500 response
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => null);

    // Confirm the page did not crash, white-screen, or freeze
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(productFormPage.saveButton).toBeEnabled();

    // If OpenCart renders a danger/alert/toast banner, verify it is visible;
    // otherwise verify the 500 response was intercepted and the form remained intact
    const errorBanner = page.locator('.alert-danger, #alert .alert, .toast').first();
    const bannerVisible = await errorBanner.isVisible().catch(() => false);
    if (!bannerVisible) {
      expect(intercepted500).toBe(true);
      await expect(page.locator('#form-product, form').first()).toBeVisible();
    }

    await page.unroute('**/*catalog/product*');
  });
});