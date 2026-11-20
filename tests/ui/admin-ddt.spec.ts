import { test, expect } from '../../fixtures/admin.fixture';
import ddtProducts from '../../fixtures/test-data/products-ddt.json';

interface DdtProductRow {
  namePrefix: string;
  metaTitlePrefix: string;
  modelPrefix: string;
  price: string;
  quantity: string;
}

test.describe('OpenCart Admin - Data-Driven Testing (JSON)', () => {
  test('TC-DDT-01: Create and verify multiple products from external JSON dataset', async ({
    authenticatedDashboard,
    productListPage,
    productFormPage,
  }) => {
    await authenticatedDashboard.expectLoaded();

    const dataset = ddtProducts as DdtProductRow[];
    const createdNames: string[] = [];

    for (let i = 0; i < dataset.length; i++) {
      const rowData = dataset[i];
      const uniqueSuffix = `${Date.now()}-${i + 1}`;
      const product = {
        name: `${rowData.namePrefix} ${uniqueSuffix}`,
        metaTitle: `${rowData.metaTitlePrefix} ${uniqueSuffix}`,
        model: `${rowData.modelPrefix}-${uniqueSuffix}`,
        price: rowData.price,
        quantity: rowData.quantity,
      };

      await productListPage.open();
      await productListPage.clickAddNew();

      await productFormPage.fillGeneralAndData(product);
      await productFormPage.save();

      await productListPage.open();
      await productListPage.filterByName(product.name);
      const createdRow = productListPage.rowByText(product.name);
      await expect(createdRow).toBeVisible();
      await expect(createdRow).toContainText(product.model);

      createdNames.push(product.name);
    }

    // Clean up created DDT test products so the catalog stays tidy
    for (const productName of createdNames) {
      await productListPage.open();
      await productListPage.filterByName(productName);
      await productListPage.deleteProductByName(productName);
    }
  });
});