// 6+ foundational UI "Happy Path" test
import { test, expect } from '../../fixtures/admin.fixture';

test.describe('OpenCart Admin - Foundational UI Happy Path Workflows', () => {
  test('TC-UI-01 [Auth]: Admin login generates user_token and loads Dashboard', async ({
    loginPage,
    dashboardPage,
  }) => {
    await loginPage.open();
    await loginPage.login('demo', 'demo');
    await dashboardPage.expectLoaded();
  });

  test('TC-UI-02 [Navigation]: Navigate from Dashboard to Catalog > Products via sidebar', async ({
    authenticatedDashboard,
    productListPage,
  }) => {
    await authenticatedDashboard.navigateSidebar('Catalog', 'Products');
    await expect(authenticatedDashboard.page).toHaveURL(/route=catalog\/product/);
    await expect(productListPage.filterButton).toBeVisible();
  });

  test('TC-UI-03 [CRUD - Create]: Create a new product across General and Data tabs', async ({
    authenticatedDashboard,
    productListPage,
    productFormPage,
  }) => {
    const uniqueName = `JW QA Laptop ${Date.now()}`;
    await productListPage.open();
    await productListPage.addNewButton.click();

    await productFormPage.fillGeneralAndData({
      name: uniqueName,
      metaTitle: 'JW QA Meta Title',
      model: 'JW-MOD-001',
      price: '499.00',
    });
    await productFormPage.save();

    await productListPage.filterByName(uniqueName);
    await expect(productListPage.rowByText(uniqueName)).toBeVisible();

    // Clean up created record so test data stays tidy
    await productListPage.deleteProductByName(uniqueName);
    await expect(authenticatedDashboard.page).toHaveURL(/route=catalog\/product/);
  });

  test('TC-UI-04 [CRUD - Read/Filter]: Filter Products grid by existing product name', async ({
    authenticatedDashboard: _dash,
    productListPage,
  }) => {
    await productListPage.open();
    await productListPage.filterByName('MacBook');
    await expect(productListPage.rowByText('MacBook')).toBeVisible();
  });

  test('TC-UI-05 [CRUD - Update]: Edit an existing product model and save changes', async ({
    authenticatedDashboard: _dash,
    productListPage,
    productFormPage,
  }) => {
    const tempName = `JW Edit Target ${Date.now()}`;
    await productListPage.open();
    await productListPage.addNewButton.click();
    await productFormPage.fillGeneralAndData({
      name: tempName,
      metaTitle: 'Edit Target Meta',
      model: 'OLD-MODEL',
      price: '150.00',
    });
    await productFormPage.save();

    await productListPage.filterByName(tempName);
    await productListPage.clickEditOnProduct(tempName);
    await productFormPage.updateModel('NEW-MODEL-UPDATED');
    await productFormPage.save();

    await productListPage.filterByName(tempName);
    await expect(productListPage.rowByText('NEW-MODEL-UPDATED')).toBeVisible();

    // Clean up
    await productListPage.deleteProductByName(tempName);
  });

  test('TC-UI-06 [CRUD - Delete]: Delete a test product and verify removal from grid', async ({
    authenticatedDashboard: _dash,
    productListPage,
    productFormPage,
  }) => {
    const deleteTarget = `JW Delete Me ${Date.now()}`;
    await productListPage.open();
    await productListPage.addNewButton.click();
    await productFormPage.fillGeneralAndData({
      name: deleteTarget,
      metaTitle: 'Delete Meta',
      model: 'DEL-001',
      price: '50.00',
    });
    await productFormPage.save();

    await productListPage.filterByName(deleteTarget);
    await productListPage.deleteProductByName(deleteTarget);

    await productListPage.filterByName(deleteTarget);
    await expect(productListPage.rowByText(deleteTarget)).toHaveCount(0);
  });
});