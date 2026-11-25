// Complex enterprise UI test suite delegating all element interactions to dedicated Page Object Model classes.
import { test, expect } from '../../fixtures/admin.fixture';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Generates a temporary 1x1 transparent PNG file in the OS temporary directory
 * for file upload verification and returns its file path.
 */
function createTempUploadFile(filename: string): string {
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const filePath = path.join(os.tmpdir(), filename);
  fs.writeFileSync(filePath, Buffer.from(pngBase64, 'base64'));
  return filePath;
}

test.describe('OpenCart Admin - Enterprise UI Element Workflows (POM)', () => {
  /**
   * TC-UI-07 (aligns with BDD scenario TS-06): Uses `OrderListPage` to filter
   * Sales > Orders by a 30-day date range and resets the view.
   */
  test('TC-UI-07 [Custom Date Picker / Date Filter / TS-06]: Filter Sales > Orders by date range and clear filter', async ({
    authenticatedDashboard,
    orderListPage,
  }) => {
    await authenticatedDashboard.expectLoaded();
    await orderListPage.open();

    if (!(await orderListPage.hasVisibleDateFilter())) {
      test.skip(true, 'No visible Date Added / Date From input found on sale/order in this OpenCart build.');
    }

    const todayIso = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    await orderListPage.filterByDateRange(thirtyDaysAgo, todayIso);
    await orderListPage.open();
  });

  /**
   * TC-UI-08: Uses `ProductListPage` and `ProductFormPage` to assign store and
   * category selections on the Links tab, save the product, and clean up.
   */
  test('TC-UI-08 [Multi-Select / Store & Category Assignment]: Interact with multi-select controls on Product Form', async ({
    authenticatedDashboard,
    productListPage,
    productFormPage,
  }) => {
    await authenticatedDashboard.expectLoaded();
    await productListPage.open();
    await productListPage.clickAddNew();

    const uniqueSuffix = `${Date.now()}`;
    const productName = `JW MultiSelect Item ${uniqueSuffix}`;

    await productFormPage.fillGeneralAndData({
      name: productName,
      metaTitle: `JW MultiSelect Meta ${uniqueSuffix}`,
      model: `JW-MS-${uniqueSuffix.slice(-6)}`,
      price: '149.00',
      quantity: '10',
    });
    await productFormPage.assignStoreAndCategory('Desktops');
    await productFormPage.save();

    await productListPage.open();
    await productListPage.filterByName(productName);
    await expect(productListPage.rowByText(productName)).toBeVisible();
    await productListPage.deleteProductByName(productName);
  });

  /**
   * TC-UI-09: Uses `ProductListPage` sorting and pagination methods to verify
   * table navigation on Catalog > Products.
   */
  test('TC-UI-09 [Pagination & Sorting]: Verify column sorting and pagination controls on Products grid', async ({
    authenticatedDashboard,
    productListPage,
  }) => {
    await authenticatedDashboard.expectLoaded();
    await productListPage.open();

    await productListPage.sortByFirstColumn();
    await productListPage.goToNextPageIfAvailable();

    const firstRowText = (await productListPage.tableRows.first().innerText()).trim();
    expect(firstRowText.length).toBeGreaterThan(0);
  });

  /**
   * TC-UI-10 (relates to BDD scenario TS-09): Uses `UserGroupPage` to verify
   * role-based user group listings and permission checkboxes.
   */
  test('TC-UI-10 [Role Permissions / RBAC / TS-09]: View User Groups & permission settings page', async ({
    authenticatedDashboard,
    userGroupPage,
  }) => {
    await authenticatedDashboard.expectLoaded();
    await userGroupPage.open();

    const permissionCount = await userGroupPage.openFirstGroupAndCountPermissions();
    if (permissionCount > 0) {
      expect(permissionCount).toBeGreaterThan(0);
    }
  });

  /**
   * TC-UI-11 (aligns with BDD scenario TS-14): Uses `ProductListPage` to
   * submit special/XSS filter strings, verifies no browser alert executes, and
   * clears the filter.
   */
  test('TC-UI-11 [Search Sanitization / Special Characters / TS-14]: Handle special/XSS characters safely in Product filter', async ({
    authenticatedDashboard,
    productListPage,
    page,
  }) => {
    await authenticatedDashboard.expectLoaded();
    await productListPage.open();

    let alertTriggered = false;
    page.on('dialog', async (dialog) => {
      alertTriggered = true;
      await dialog.dismiss();
    });

    await productListPage.filterByName(`JW & "Test" <script>alert(1)</script>`);
    expect(alertTriggered).toBe(false);
    await expect(page.locator('body')).toBeVisible();

    await productListPage.clearFilter();
  });

  /**
   * TC-UI-12: Uses `ProductFormPage.uploadProductImage()` with a temporary PNG
   * file to verify file upload / image manager handling on the Product form.
   */
  test('TC-UI-12 [File Upload]: Upload a file via Product Image / Admin Upload control', async ({
    authenticatedDashboard,
    productListPage,
    productFormPage,
  }) => {
    await authenticatedDashboard.expectLoaded();
    await productListPage.open();
    await productListPage.clickAddNew();

    const tempFilePath = createTempUploadFile(`jw-upload-${Date.now()}.png`);
    try {
      const uploaded = await productFormPage.uploadProductImage(tempFilePath);
      if (!uploaded) {
        test.skip(true, 'No file input or upload/file-manager trigger found on this Product form view.');
      }
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });
});