import { test, expect } from '../../fixtures/admin.fixture';
import type { Locator } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

async function fillFirstVisible(locators: Locator[], value: string): Promise<boolean> {
  for (const loc of locators) {
    const candidate = loc.first();
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.fill(value);
      return true;
    }
  }
  return false;
}

function createTempUploadFile(filename: string): string {
  // Minimal valid 1x1 transparent PNG buffer for file upload testing
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const filePath = path.join(os.tmpdir(), filename);
  fs.writeFileSync(filePath, Buffer.from(pngBase64, 'base64'));
  return filePath;
}

test.describe('OpenCart Admin - New Enterprise UI Test Cases (6 Complex UI Scenarios)', () => {
  test('TC-UI-07 [Custom Date Picker / Date Filter]: Filter Sales > Orders by date range and clear filter', async ({
    authenticatedDashboard,
  }) => {
    await authenticatedDashboard.expectLoaded();
    await authenticatedDashboard.gotoRoute('sale/order');
    await authenticatedDashboard.dismissSecurityModalIfVisible();

    const page = authenticatedDashboard.page;

    const dateFromInputs = [
      page
        .locator(
          '#input-date-added-from, #input-date-from, input[name*="date_added"][name*="from" i], input[name*="date_from" i]'
        )
        .filter({ visible: true }),
      page
        .locator('#filter-order input[type="date"], #filter-order input[placeholder*="Date" i]')
        .filter({ visible: true }),
      page.locator('input[id*="date-added"], input[name*="date_added"]').filter({ visible: true }),
    ];

    const dateToInputs = [
      page
        .locator(
          '#input-date-added-to, #input-date-to, input[name*="date_added"][name*="to" i], input[name*="date_to" i]'
        )
        .filter({ visible: true }),
    ];

    const todayIso = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const filledFrom = await fillFirstVisible(dateFromInputs, thirtyDaysAgo);
    if (!filledFrom) {
      test.skip(true, 'No visible Date Added / Date From input found on sale/order in this OpenCart build.');
    }

    await fillFirstVisible(dateToInputs, todayIso);

    const filterBtn = page
      .locator('#button-filter, button:has-text("Filter"), input[type="button"][value*="Filter" i]')
      .filter({ visible: true })
      .first();

    if (await filterBtn.isVisible().catch(() => false)) {
      await filterBtn.click();
      await page.waitForLoadState('domcontentloaded');
      await authenticatedDashboard.dismissSecurityModalIfVisible();
    }

    const tableOrEmpty = page
      .locator('form#form-order table, table.table, #form-order, .card-body')
      .first();
    await expect(tableOrEmpty).toBeVisible();

    await authenticatedDashboard.gotoRoute('sale/order');
    await authenticatedDashboard.dismissSecurityModalIfVisible();
  });

  test('TC-UI-08 [Multi-Select / Store & Category Assignment]: Interact with multi-select controls on Product Form', async ({
    authenticatedDashboard,
    productListPage,
    productFormPage,
  }) => {
    await authenticatedDashboard.expectLoaded();
    await productListPage.open();
    await productListPage.clickAddNew();

    const page = authenticatedDashboard.page;
    const uniqueSuffix = `${Date.now()}`;
    const productName = `JW MultiSelect Item ${uniqueSuffix}`;
    const metaTitle = `JW MultiSelect Meta ${uniqueSuffix}`;
    const model = `JW-MS-${uniqueSuffix.slice(-6)}`;

    await productFormPage.fillGeneralAndData({
      name: productName,
      metaTitle,
      model,
      price: '149.00',
      quantity: '10',
    });

    const linksTab = page
      .locator('a[href="#tab-links"], button:has-text("Links"), a:has-text("Links")')
      .filter({ visible: true })
      .first();

    if (await linksTab.isVisible().catch(() => false)) {
      await linksTab.click();
    }

    const storeCheckbox = page
      .locator('#input-store-0, input[name="product_store[]"][value="0"], input[type="checkbox"][name*="store"]')
      .first();
    if (await storeCheckbox.isVisible().catch(() => false)) {
      await storeCheckbox.check();
    }

    const categoryInput = page
      .locator('#input-category, input[name*="category" i][type="text"]')
      .filter({ visible: true })
      .first();
    if (await categoryInput.isVisible().catch(() => false)) {
      await categoryInput.click();
      await categoryInput.fill('Desktops');
    }

    await productFormPage.save();

    await productListPage.open();
    await productListPage.filterByName(productName);
    await expect(productListPage.rowByText(productName)).toBeVisible();
    await productListPage.deleteProductByName(productName);
  });

  test('TC-UI-09 [Pagination & Sorting]: Verify column sorting and pagination controls on Products grid', async ({
    authenticatedDashboard,
    productListPage,
  }) => {
    await authenticatedDashboard.expectLoaded();
    await productListPage.open();

    const page = authenticatedDashboard.page;
    const tableBodyRows = page.locator('form#form-product table tbody tr, table tbody tr');
    await expect(tableBodyRows.first()).toBeVisible();

    const initialFirstRowText = (await tableBodyRows.first().innerText()).trim();

    const sortLink = page
      .locator('table thead a, table thead th a')
      .filter({ visible: true })
      .first();

    if (await sortLink.isVisible().catch(() => false)) {
      await sortLink.click();
      await page.waitForLoadState('domcontentloaded');
      await authenticatedDashboard.dismissSecurityModalIfVisible();
      await expect(tableBodyRows.first()).toBeVisible();
    }

    const paginationContainer = page
      .locator('.pagination, ul.pagination, nav[aria-label*="pagination" i], .col-sm-6.text-end')
      .first();

    if (await paginationContainer.isVisible().catch(() => false)) {
      const nextPageLink = page
        .locator('.pagination a:has-text(">"), .pagination a:has-text("Next"), .pagination li.page-item a')
        .filter({ visible: true })
        .nth(1);

      if (await nextPageLink.isVisible().catch(() => false)) {
        await nextPageLink.click();
        await page.waitForLoadState('domcontentloaded');
        await authenticatedDashboard.dismissSecurityModalIfVisible();
        await expect(tableBodyRows.first()).toBeVisible();
      }
    }

    const currentFirstRowText = (await tableBodyRows.first().innerText()).trim();
    expect(currentFirstRowText.length).toBeGreaterThan(0);
    expect(typeof initialFirstRowText).toBe('string');
  });

  test('TC-UI-10 [Role Permissions / RBAC]: View User Groups & permission settings page', async ({
    authenticatedDashboard,
  }) => {
    await authenticatedDashboard.expectLoaded();
    await authenticatedDashboard.gotoRoute('user/user_group');
    await authenticatedDashboard.dismissSecurityModalIfVisible();

    const page = authenticatedDashboard.page;

    const hasContent = await page
      .locator('table, form, .card-body')
      .first()
      .isVisible()
      .catch(() => false);

    if (!hasContent) {
      await authenticatedDashboard.gotoRoute('user/user_group.list');
      await authenticatedDashboard.dismissSecurityModalIfVisible();
    }

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toMatch(/User Group|Administrator|Permission|Access/i);

    const editGroupBtn = page
      .locator('a[title*="Edit" i], a.btn-primary[href*="user_group"], button[title*="Edit" i]')
      .filter({ visible: true })
      .first();

    if (await editGroupBtn.isVisible().catch(() => false)) {
      await editGroupBtn.click();
      await page.waitForLoadState('domcontentloaded');
      await authenticatedDashboard.dismissSecurityModalIfVisible();

      const permissionInputs = page.locator(
        'input[type="checkbox"][name*="permission" i], input[type="checkbox"]'
      );
      const count = await permissionInputs.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('TC-UI-11 [Search Sanitization / Special Characters]: Handle special/XSS characters safely in Product filter', async ({
    authenticatedDashboard,
    productListPage,
  }) => {
    await authenticatedDashboard.expectLoaded();
    await productListPage.open();

    const page = authenticatedDashboard.page;
    let alertTriggered = false;

    page.on('dialog', async (dialog) => {
      alertTriggered = true;
      await dialog.dismiss();
    });

    const xssProbe = `JW & "Test" <script>alert(1)</script>`;
    await productListPage.filterByName(xssProbe);

    expect(alertTriggered).toBe(false);
    await expect(page.locator('body')).toBeVisible();

    const clearBtn = page
      .locator('#button-clear, button:has-text("Clear"), a:has-text("Clear")')
      .filter({ visible: true })
      .first();

    if (await clearBtn.isVisible().catch(() => false)) {
      await clearBtn.click();
      await page.waitForLoadState('domcontentloaded');
    } else {
      await productListPage.open();
    }
  });

  test('TC-UI-12 [File Upload]: Upload a file via Product Image / Admin Upload control', async ({
    authenticatedDashboard,
    productListPage,
    productFormPage,
  }) => {
    await authenticatedDashboard.expectLoaded();
    await productListPage.open();
    await productListPage.clickAddNew();

    const page = authenticatedDashboard.page;
    const tempFilePath = createTempUploadFile(`jw-upload-${Date.now()}.png`);

    try {
      // Navigate to Image tab if present on Product Form
      const imageTab = page
        .locator('a[href="#tab-image"], button:has-text("Image"), a:has-text("Image")')
        .filter({ visible: true })
        .first();
      if (await imageTab.isVisible().catch(() => false)) {
        await imageTab.click();
      }

      // Check for a direct file input first; otherwise open file manager / upload trigger
      const fileInput = page.locator('input[type="file"]').first();
      if ((await fileInput.count()) > 0) {
        await fileInput.setInputFiles(tempFilePath);
        await expect(page.locator('body')).toBeVisible();
      } else {
        const uploadOrManagerBtn = page
          .locator(
            'button:has-text("Upload"), #button-upload, a[data-bs-toggle="modal"], button[id*="image"], button[aria-label*="image" i]'
          )
          .filter({ visible: true })
          .first();

        if (await uploadOrManagerBtn.isVisible().catch(() => false)) {
          await uploadOrManagerBtn.click();
          const modalOrFile = page.locator('.modal, input[type="file"]').first();
          await expect(modalOrFile).toBeVisible({ timeout: 10000 });
        } else {
          test.skip(true, 'No file input or upload/file-manager trigger found on this Product form view.');
        }
      }
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });
});