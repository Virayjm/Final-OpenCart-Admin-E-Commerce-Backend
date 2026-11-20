// Catalog > Products table filtering, sorting, delete
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductListPage extends BasePage {
  readonly addNewButton: Locator;
  readonly deleteButton: Locator;
  readonly filterNameInput: Locator;
  readonly filterButton: Locator;
  readonly tableRows: Locator;

  constructor(page: Page) {
    super(page);
    this.addNewButton = page.locator('a[data-bs-original-title="Add New"], a[title="Add New"], a[href*="catalog/product/add"], a[href*="catalog/product.form"]').first();
    this.deleteButton = page.locator('button[formaction*="delete"], button[data-bs-original-title="Delete"], button[title="Delete"]').first();
    this.filterNameInput = page.locator('#input-name');
    this.filterButton = page.locator('#button-filter');
    this.tableRows = page.locator('table tbody tr');
  }

  async open(): Promise<void> {
    await this.gotoRoute('catalog/product');
    await expect(this.filterButton).toBeVisible();
  }

  async filterByName(name: string): Promise<void> {
    await this.filterNameInput.fill(name);
    await Promise.all([
      this.page.waitForResponse((res) =>
        res.url().includes('catalog/product') && res.status() === 200
      ),
      this.filterButton.click(),
    ]);
  }

  rowByText(text: string): Locator {
    return this.tableRows.filter({ hasText: text }).first();
  }

  async clickEditOnProduct(productName: string): Promise<void> {
    const row = this.rowByText(productName);
    await expect(row).toBeVisible();
    await row.locator('a[href*="edit"], a[href*="form"]').first().click();
  }

  async deleteProductByName(productName: string): Promise<void> {
    const row = this.rowByText(productName);
    await expect(row).toBeVisible();
    await row.locator('input[type="checkbox"]').check();

    this.page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await this.deleteButton.click();
    await this.expectSuccessAlert();
  }
}