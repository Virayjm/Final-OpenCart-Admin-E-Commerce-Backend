import { test, expect } from '../../fixtures/admin.fixture';

test.describe('OpenCart Admin - Visual Regression (toHaveScreenshot)', () => {
  test('TC-VIS-01: Capture/verify Admin Dashboard layout', async ({
    authenticatedDashboard,
    page,
  }) => {
    await authenticatedDashboard.expectLoaded();
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);

    // Mask dynamic metric cards/charts if needed to avoid false positives from live numbers
    const dynamicWidgets = page.locator('.tile, .card, canvas');
    await expect(page).toHaveScreenshot('admin-dashboard.png', {
      mask: (await dynamicWidgets.count()) > 0 ? [dynamicWidgets.first()] : [],
      maxDiffPixelRatio: 0.05,
    });
  });

  test('TC-VIS-02: Capture/verify Catalog > Products grid layout', async ({
    authenticatedDashboard,
    productListPage,
    page,
  }) => {
    await authenticatedDashboard.expectLoaded();
    await productListPage.open();
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);

    await expect(page).toHaveScreenshot('catalog-products-grid.png', {
      mask: [productListPage.tableRows],
      maxDiffPixelRatio: 0.05,
    });
  });

  test('TC-VIS-03: Capture/verify Sales > Orders page layout', async ({
    authenticatedDashboard,
    page,
  }) => {
    await authenticatedDashboard.expectLoaded();
    await page.getByRole('link', { name: /^Sales$/i }).first().click().catch(() => null);
    const ordersLink = page.getByRole('link', { name: /^Orders$/i }).first();
    if (await ordersLink.isVisible().catch(() => false)) {
      await ordersLink.click();
    } else {
      const currentUrl = new URL(page.url());
      const token = currentUrl.searchParams.get('user_token') || '';
      await page.goto(
        `${process.env.OPENCART_ADMIN_URL || 'http://localhost/opencart/upload/admin/'}index.php?route=sale/order${token ? `&user_token=${token}` : ''}`
      );
    }

    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);

    const rows = page.locator('table tbody tr');
    await expect(page).toHaveScreenshot('sales-orders-list.png', {
      mask: (await rows.count()) > 0 ? [rows] : [],
      maxDiffPixelRatio: 0.05,
    });
  });
});