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
    this.addNewButton = this.page
      .locator(
        '.page-header a.btn-primary, #content .btn-primary[href*="product"], a[data-bs-original-title="Add New"], a[title="Add New"], a[href*="catalog/product.form"], a[href*="catalog/product/add"]'
      )
      .first();
    this.deleteButton = page
      .locator(
        'button[formaction*="delete"], button[data-bs-original-title="Delete"], button[title="Delete"], button.btn-danger'
      )
      .first();
    this.filterNameInput = page
      .locator(
        '#input-filter-name, input[name="filter_name"], #input-name, .card:has-text("Filter") input[placeholder*="Product Name"]'
      )
      .filter({ visible: true })
      .first();
    this.filterButton = page
      .locator('#button-filter, button[id*="filter"], button:has-text("Filter")')
      .first();
    this.tableRows = page.locator('form#form-product table tbody tr, table tbody tr');
  }

  async open(): Promise<void> {
    await this.dismissSecurityModalIfVisible();
    await this.navigateSidebar('Catalog', 'Products');
    await expect(this.page).toHaveURL(/catalog\/product/i);
    await expect(this.tableRows.or(this.filterButton).first()).toBeVisible();
  }

  async filterByName(name: string): Promise<void> {
    await this.dismissSecurityModalIfVisible();

    await expect(this.filterNameInput).toBeVisible();
    await this.filterNameInput.fill(name);

    await expect(this.filterButton).toBeVisible();
    await this.filterButton.click();

    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
    await this.page.waitForLoadState('domcontentloaded');
  }

  rowByText(text: string): Locator {
    return this.page
      .locator('form#form-product table tbody tr, table tbody tr')
      .filter({ hasText: text })
      .first();
  }

  async clickEditOnProduct(productName: string): Promise<void> {
    const row = this.rowByText(productName);
    await expect(row).toBeVisible();
    const editLink = row.locator('a[href*="edit"], a[href*="form"], a.btn-primary').first();
    await editLink.scrollIntoViewIfNeeded();
    await editLink.click();
    await this.page.waitForLoadState('domcontentloaded');
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

  async clickAddNew(): Promise<void> {
    await this.dismissSecurityModalIfVisible();
    await expect(this.addNewButton).toBeVisible();
    await this.addNewButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}