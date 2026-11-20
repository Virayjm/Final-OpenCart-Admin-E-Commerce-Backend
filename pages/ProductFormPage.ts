// Add/Edit multi-tab product form (General, Data, etc.)
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface ProductPayload {
  name: string;
  metaTitle: string;
  model: string;
  price?: string;
  quantity?: string;
}

export class ProductFormPage extends BasePage {
  readonly dataPane: Locator;
  readonly generalTab: Locator;
  readonly dataTab: Locator;
  readonly linksTab: Locator;
  readonly seoTab: Locator;
  readonly productNameInput: Locator;
  readonly metaTitleInput: Locator;
  readonly modelInput: Locator;
  readonly priceInput: Locator;
  readonly quantityInput: Locator;
  readonly defaultStoreCheckbox: Locator;
  readonly seoKeywordInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);

    this.dataPane = page.locator('#tab-data');

    this.generalTab = page
      .locator('a[href="#tab-general"], button[data-bs-target="#tab-general"]')
      .first();
    this.dataTab = page
      .locator('a[href="#tab-data"], button[data-bs-target="#tab-data"]')
      .first();
    this.linksTab = page
      .locator('a[href="#tab-links"], button[data-bs-target="#tab-links"]')
      .first();
    this.seoTab = page
      .locator('a[href="#tab-seo"], button[data-bs-target="#tab-seo"]')
      .first();

    this.productNameInput = page
      .locator('#input-name-1, input[name="product_description[1][name]"]')
      .first();

    this.metaTitleInput = page
      .locator('#input-meta-title-1, input[name="product_description[1][meta_title]"]')
      .first();

    this.modelInput = page.locator('#input-model, input[name="model"]').first();
    this.priceInput = page.locator('#input-price, input[name="price"]').first();
    this.quantityInput = page.locator('#input-quantity, input[name="quantity"]').first();

    this.defaultStoreCheckbox = page
      .locator('input[name="product_store[]"][value="0"], #input-store-0')
      .first();

    // Confirmed from call log: id="input-keyword-0-1", name="product_seo_url[0][1]"
    this.seoKeywordInput = page
      .locator('#input-keyword-0-1, input[name="product_seo_url[0][1]"]')
      .first();

    this.saveButton = page
      .locator(
        'button[form="form-product"], button[type="submit"], a[href*="save"], button[title*="Save"], a[title*="Save"], .btn-primary[form]'
      )
      .first();
  }

  async openGeneralTab(): Promise<void> {
    await this.dismissSecurityModalIfVisible();
    if ((await this.generalTab.count().catch(() => 0)) > 0) {
      await this.generalTab.scrollIntoViewIfNeeded();
      await this.generalTab.click();
    }
  }

  async openDataTab(): Promise<void> {
    await this.dismissSecurityModalIfVisible();
    if ((await this.dataTab.count().catch(() => 0)) > 0) {
      await this.dataTab.scrollIntoViewIfNeeded();
      await this.dataTab.click();
    }
    if ((await this.dataPane.count().catch(() => 0)) > 0) {
      await expect(this.dataPane).toBeVisible();
    }
  }

  async ensureDefaultStoreChecked(): Promise<void> {
    await this.dismissSecurityModalIfVisible();
    if ((await this.linksTab.count().catch(() => 0)) > 0) {
      await this.linksTab.scrollIntoViewIfNeeded();
      await this.linksTab.click();
    }
    if ((await this.defaultStoreCheckbox.count().catch(() => 0)) > 0) {
      if (!(await this.defaultStoreCheckbox.isChecked().catch(() => true))) {
        await this.defaultStoreCheckbox.check();
      }
    }
  }

  async fillSeoKeyword(productName: string): Promise<void> {
    await this.dismissSecurityModalIfVisible();
    if ((await this.seoTab.count().catch(() => 0)) > 0) {
      await this.seoTab.scrollIntoViewIfNeeded();
      await this.seoTab.click();
    }

    await expect(this.seoKeywordInput).toBeVisible();

    const uniquePart = Date.now().toString().slice(-6);
    const baseSlug =
      productName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 45) || 'product';
    const seoKeyword = `${baseSlug}-${uniquePart}`.slice(0, 64);

    await this.seoKeywordInput.scrollIntoViewIfNeeded();
    await this.seoKeywordInput.fill(seoKeyword);
  }

  async fillGeneralAndData(payload: ProductPayload): Promise<void> {
    await this.openGeneralTab();

    await expect(this.productNameInput).toBeVisible();
    await this.productNameInput.fill(payload.name);

    await expect(this.metaTitleInput).toBeVisible();
    await this.metaTitleInput.fill(payload.metaTitle);

    await this.openDataTab();

    await expect(this.modelInput).toBeVisible();
    await this.modelInput.fill(payload.model);

    if (payload.price !== undefined && (await this.priceInput.isVisible().catch(() => false))) {
      await this.priceInput.fill(payload.price);
    }

    if (payload.quantity !== undefined && (await this.quantityInput.isVisible().catch(() => false))) {
      await this.quantityInput.fill(payload.quantity);
    }

    await this.ensureDefaultStoreChecked();
    await this.fillSeoKeyword(payload.name);
  }

  async updateModel(newModel: string): Promise<void> {
    await this.openDataTab();
    await expect(this.modelInput).toBeVisible();
    await this.modelInput.fill(newModel);
  }

  async save(): Promise<void> {
    await this.dismissSecurityModalIfVisible();
    await expect(this.saveButton).toBeVisible();

    await Promise.all([
      this.page
        .waitForResponse(
          (res) =>
            res.url().includes('catalog/product') &&
            ['POST', 'PUT'].includes(res.request().method()),
          { timeout: 10000 }
        )
        .catch(() => null),
      this.saveButton.click(),
    ]);

    const dangerAlert = this.page.locator('#alert .alert-danger, .alert-danger').first();
    if (await dangerAlert.isVisible().catch(() => false)) {
      const errorText = (await dangerAlert.textContent())?.trim();
      const fieldErrors = await this.page
        .locator('.invalid-feedback, [id^="error-"]')
        .evaluateAll((els) =>
          els
            .map((el) => (el.textContent || '').trim())
            .filter((txt) => txt.length > 0)
        );
      const tabBadges = await this.page
        .locator('.nav-tabs .nav-link')
        .evaluateAll((els) =>
          els
            .map((el) => ({
              tab: (el.textContent || '').trim(),
              hasErrorClass:
                el.classList.contains('text-danger') ||
                el.querySelector('.badge, .text-danger') !== null,
            }))
            .filter((x) => x.hasErrorClass)
            .map((x) => x.tab)
        );

      const details = [
        tabBadges.length ? `Tabs with error indicators: ${tabBadges.join(', ')}` : '',
        fieldErrors.length ? `Field errors: ${fieldErrors.join(' | ')}` : '',
      ]
        .filter(Boolean)
        .join(' — ');

      throw new Error(
        `Product save failed with alert: ${errorText}${details ? ` — ${details}` : ''}`
      );
    }

    await this.expectSuccessAlert();
  }
}