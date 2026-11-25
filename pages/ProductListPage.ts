// Catalog > Products list view page object for filtering, sorting, editing, creating, and deleting products.
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Models the OpenCart Admin Catalog > Products management screen, supporting
 * product filtering, row lookup, navigation to Add/Edit forms, and record deletion.
 */
export class ProductListPage extends BasePage {
  readonly addNewButton: Locator;
  readonly deleteButton: Locator;
  readonly filterNameInput: Locator;
  readonly filterButton: Locator;
  readonly tableRows: Locator;

  /**
   * Initializes locators for the Add New action, Delete action, Product Name
   * filter input, Filter submit button, and product table rows.
   */
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
      .locator('#input-name, input[name="filter_name"], input[placeholder*="Product Name"]')
      .first();
    this.filterButton = page
      .locator('#button-filter, button[id*="filter"], button:has-text("Filter")')
      .first();
    this.tableRows = page.locator('form#form-product table tbody tr, table tbody tr');
  }

  /**
   * Navigates to Catalog > Products through the left sidebar and waits for
   * the product table rows or filter controls to render.
   */
  async open(): Promise<void> {
    await this.dismissSecurityModalIfVisible();
    await this.navigateSidebar('Catalog', 'Products');
    await expect(this.page).toHaveURL(/catalog\/product/i);
    await expect(this.tableRows.or(this.filterButton).first()).toBeVisible();
  }

  /**
   * Enters a product name into the filter field, triggers filtering, and waits
   * for the catalog product response to complete when applicable.
   */
  async filterByName(name: string): Promise<void> {
    if (await this.filterNameInput.isVisible().catch(() => false)) {
      await this.filterNameInput.fill(name);
    }
    if (await this.filterButton.isVisible().catch(() => false)) {
      await Promise.all([
        this.page
          .waitForResponse(
            (res) => res.url().includes('catalog/product') && res.status() === 200,
            { timeout: 10000 }
          )
          .catch(() => null),
        this.filterButton.click(),
      ]);
    }
  }

  /**
   * Returns a locator for the first table row containing the specified text.
   */
  rowByText(text: string): Locator {
    return this.tableRows.filter({ hasText: text }).first();
  }

  /**
   * Clicks the Add New product button on the product list toolbar and waits
   * for the product form page to load.
   */
  async clickAddNew(): Promise<void> {
    await this.dismissSecurityModalIfVisible();
    await expect(this.addNewButton).toBeVisible();
    await this.addNewButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Locates the row matching `productName` and clicks its Edit/Form action link.
   */
  async clickEditOnProduct(productName: string): Promise<void> {
    const row = this.rowByText(productName);
    await expect(row).toBeVisible();
    await row.locator('a[href*="edit"], a[href*="form"], a.btn-primary').first().click();
  }

  /**
   * Selects the row checkbox for `productName`, accepts the confirmation dialog,
   * clicks Delete, and verifies the success alert banner.
   */
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

  /**
   * Clicks the first visible table column sort header and waits for the
   * sorted grid rows to render.
   */
  async sortByFirstColumn(): Promise<void> {
    await expect(this.tableRows.first()).toBeVisible();
    const sortLink = this.page
      .locator('table thead a, table thead th a')
      .filter({ visible: true })
      .first();

    if (await sortLink.isVisible().catch(() => false)) {
      await sortLink.click();
      await this.page.waitForLoadState('domcontentloaded');
      await this.dismissSecurityModalIfVisible();
      await expect(this.tableRows.first()).toBeVisible();
    }
  }

  /**
   * Navigates to the next pagination page if multiple pages exist in the
   * product grid and verifies rows remain visible.
   */
  async goToNextPageIfAvailable(): Promise<void> {
    const paginationContainer = this.page
      .locator('.pagination, ul.pagination, nav[aria-label*="pagination" i], .col-sm-6.text-end')
      .first();

    if (await paginationContainer.isVisible().catch(() => false)) {
      const nextPageLink = this.page
        .locator('.pagination a:has-text(">"), .pagination a:has-text("Next"), .pagination li.page-item a')
        .filter({ visible: true })
        .nth(1);

      if (await nextPageLink.isVisible().catch(() => false)) {
        await nextPageLink.click();
        await this.page.waitForLoadState('domcontentloaded');
        await this.dismissSecurityModalIfVisible();
        await expect(this.tableRows.first()).toBeVisible();
      }
    }
  }

  /**
   * Clears any active product filter or reloads the unfiltered Catalog >
   * Products list.
   */
  async clearFilter(): Promise<void> {
    const clearBtn = this.page
      .locator('#button-clear, button:has-text("Clear"), a:has-text("Clear")')
      .filter({ visible: true })
      .first();

    if (await clearBtn.isVisible().catch(() => false)) {
      await clearBtn.click();
      await this.page.waitForLoadState('domcontentloaded');
    } else {
      await this.open();
    }
  }
}