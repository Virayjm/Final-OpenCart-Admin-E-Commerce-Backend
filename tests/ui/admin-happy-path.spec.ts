// Foundational end-to-end UI "Happy Path" test suite for OpenCart Admin authentication, navigation, and product CRUD workflows.
import { test, expect } from '../../fixtures/admin.fixture';

test.describe('OpenCart Admin - Foundational UI Happy Path Workflows', () => {
  /**
   * TC-UI-01 (aligns with BDD scenario TS-01): Verifies that administrator
   * authentication generates a dynamic `user_token` session parameter and
   * loads the OpenCart Admin Dashboard.
   */
  test('TC-UI-01 [Auth / TS-01]: Admin login generates user_token and loads Dashboard', async ({
    authenticatedDashboard,
    page,
  }) => {
    await expect(page).toHaveURL(/common\/dashboard/i);
    await expect(page).toHaveURL(/user_token=/i);
    await authenticatedDashboard.expectLoaded();
  });

  /**
   * TC-UI-02 (supports navigation prerequisite for BDD scenario TS-03):
   * Verifies navigation from the Admin Dashboard to Catalog > Products via the
   * left sidebar menu.
   */
  test('TC-UI-02 [Navigation]: Navigate from Dashboard to Catalog > Products via sidebar', async ({
    authenticatedDashboard,
    productListPage,
    page,
  }) => {
    await authenticatedDashboard.expectLoaded();
    await productListPage.open();
    await expect(page).toHaveURL(/catalog\/product/i);
  });

  /**
   * TC-UI-03 (aligns with BDD scenario TS-04: Multi-Step Product Creation
   * Across Tabs): Creates a new product across General, Data, Links, and SEO
   * tabs, saves the record, confirms it appears in the filtered grid, and
   * removes the temporary test product.
   */
  test('TC-UI-03 [CRUD - Create / TS-04]: Create a new product across General and Data tabs', async ({
    authenticatedDashboard,
    productListPage,
    productFormPage,
  }) => {
    await authenticatedDashboard.expectLoaded();

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

  /**
   * TC-UI-04 (aligns with BDD scenario TS-03: Dynamic Data Table Filtering):
   * Filters the Catalog > Products table by `MacBook` and verifies that a
   * matching row is rendered.
   */
  test('TC-UI-04 [CRUD - Read/Filter / TS-03]: Filter Products grid by existing product name', async ({
    authenticatedDashboard,
    productListPage,
  }) => {
    await authenticatedDashboard.expectLoaded();
    await productListPage.open();
    await productListPage.filterByName('MacBook');
    await expect(productListPage.rowByText('MacBook')).toBeVisible();
  });

  /**
   * TC-UI-05 (catalog record modification flow): Creates a temporary product,
   * opens it for editing, updates the `Model` value on the Data tab, saves,
   * verifies the updated model in the grid, and deletes the test record.
   */
  test('TC-UI-05 [CRUD - Update]: Edit an existing product model and save changes', async ({
    authenticatedDashboard,
    productListPage,
    productFormPage,
  }) => {
    await authenticatedDashboard.expectLoaded();

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

  /**
   * TC-UI-06 (aligns with BDD scenario TS-05: Deletion and Checkbox
   * Selection): Creates a temporary product, deletes it from the Products
   * grid, re-filters by name, and asserts that no matching rows remain.
   */
  test('TC-UI-06 [CRUD - Delete / TS-05]: Delete a test product and verify removal from grid', async ({
    authenticatedDashboard,
    productListPage,
    productFormPage,
  }) => {
    await authenticatedDashboard.expectLoaded();

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