// 6+ foundational UI "Happy Path" test
import { test, expect } from '../../fixtures/admin.fixture';

test.describe('OpenCart Admin - Foundational UI Happy Path Workflows', () => {
  test('TC-UI-01 [Auth]: Admin login generates user_token and loads Dashboard', async ({
    authenticatedDashboard,
    page,
  }) => {
    await expect(page).toHaveURL(/common\/dashboard/i);
    await expect(page).toHaveURL(/user_token=/i);
    await authenticatedDashboard.expectLoaded();
  });

  test('TC-UI-02 [Navigation]: Navigate from Dashboard to Catalog > Products via sidebar', async ({
    authenticatedDashboard,
    productListPage,
    page,
  }) => {
    await authenticatedDashboard.expectLoaded();
    await productListPage.open();
    await expect(page).toHaveURL(/catalog\/product/i);
  });

  test('TC-UI-03 [CRUD - Create]: Create a new product across General and Data tabs', async ({
    authenticatedDashboard,
    productListPage,
    productFormPage,
  }) => {
    const suffix = Date.now();
    const product = {
      name: `JW QA Laptop ${suffix}`,
      metaTitle: `JW QA Meta ${suffix}`,
      model: `JW-MOD-${suffix}`,
      price: '199.00',
      quantity: '10',
    };

    await productListPage.open();
    await productListPage.clickAddNew();

    await productFormPage.fillGeneralAndData(product);
    await productFormPage.save();

    await productListPage.open();
    await productListPage.filterByName(product.name);
    await expect(productListPage.rowByText(product.name)).toBeVisible();

    await productListPage.deleteProductByName(product.name);
  });

  test('TC-UI-04 [CRUD - Read/Filter]: Filter Products grid by existing product name', async ({
    authenticatedDashboard,
    productListPage,
  }) => {
    await productListPage.open();
    await productListPage.filterByName('MacBook');
    await expect(productListPage.rowByText('MacBook')).toBeVisible();
  });

  test('TC-UI-05 [CRUD - Update]: Edit an existing product model and save changes', async ({
    authenticatedDashboard,
    productListPage,
    productFormPage,
  }) => {
    const suffix = Date.now();
    const product = {
      name: `JW Edit Target ${suffix}`,
      metaTitle: `JW Edit Meta ${suffix}`,
      model: `JW-ORIG-${suffix}`,
      price: '149.00',
      quantity: '5',
    };
    const updatedModel = `JW-UPD-${suffix}`;

    await productListPage.open();
    await productListPage.clickAddNew();
    await productFormPage.fillGeneralAndData(product);
    await productFormPage.save();

    await productListPage.open();
    await productListPage.filterByName(product.name);
    await productListPage.clickEditOnProduct(product.name);

    await productFormPage.updateModel(updatedModel);
    await productFormPage.save();

    await productListPage.open();
    await productListPage.filterByName(product.name);
    await expect(productListPage.rowByText(product.name)).toContainText(updatedModel);

    await productListPage.deleteProductByName(product.name);
  });

  test('TC-UI-06 [CRUD - Delete]: Delete a test product and verify removal from grid', async ({
    authenticatedDashboard,
    productListPage,
    productFormPage,
  }) => {
    const suffix = Date.now();
    const product = {
      name: `JW Delete Me ${suffix}`,
      metaTitle: `JW Del Meta ${suffix}`,
      model: `JW-DEL-${suffix}`,
      price: '79.00',
      quantity: '3',
    };

    await productListPage.open();
    await productListPage.clickAddNew();
    await productFormPage.fillGeneralAndData(product);
    await productFormPage.save();

    await productListPage.open();
    await productListPage.filterByName(product.name);
    await expect(productListPage.rowByText(product.name)).toBeVisible();

    await productListPage.deleteProductByName(product.name);
    await productListPage.open();
    await productListPage.filterByName(product.name);
    await expect(productListPage.rowByText(product.name)).toHaveCount(0);
  });
});