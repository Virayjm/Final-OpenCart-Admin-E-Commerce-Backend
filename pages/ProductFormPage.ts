// Multi-tab product creation and editing page object for OpenCart Admin (General, Data, Links, and SEO tabs).
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Defines the product field values submitted on the OpenCart Admin product form.
 */
export interface ProductPayload {
  name: string;
  metaTitle: string;
  model: string;
  price?: string;
  quantity?: string;
}

/**
 * Models the Add/Edit Product form in OpenCart Admin, handling tab switching,
 * required field entry, store assignment, SEO slug generation, and form submission.
 */
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

  /**
   * Initializes tab triggers, form inputs, and action locators for the product form.
   */
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

    // Confirmed in OpenCart 4.1.0.4: id="input-keyword-0-1", name="product_seo_url[0][1]"
    this.seoKeywordInput = page
      .locator('#input-keyword-0-1, input[name="product_seo_url[0][1]"]')
      .first();

    this.saveButton = page
      .locator(
        'button[form="form-product"], button[type="submit"], a[href*="save"], button[title*="Save"], a[title*="Save"], .btn-primary[form]'
      )
      .first();
  }

  /**
   * Activates the General tab after dismissing any visible security modal.
   */
  async openGeneralTab(): Promise<void> {
    await this.dismissSecurityModalIfVisible();
    if ((await this.generalTab.count().catch(() => 0)) > 0) {
      await this.generalTab.scrollIntoViewIfNeeded();
      await this.generalTab.click();
    }
  }

  /**
   * Activates the Data tab and waits for the data tab pane to become visible.
   */
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

  /**
   * Opens the Links tab and ensures the default store checkbox is selected.
   */
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

  /**
   * Opens the SEO tab and populates the Keyword field with a unique hyphenated
   * slug derived from the product name within OpenCart's 1-64 character limit.
   */
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

  /**
   * Populates General, Data, Links, and SEO fields from the supplied product payload.
   */
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

  /**
   * Switches to the Data tab and updates the product model identifier.
   */
  async updateModel(newModel: string): Promise<void> {
    await this.openDataTab();
    await expect(this.modelInput).toBeVisible();
    await this.modelInput.fill(newModel);
  }

  /**
   * Submits the product form, reports any alert or tab/field validation errors
   * if saving fails, and verifies the success alert banner.
   */
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
  
  /**
   * Opens the Links tab, ensures the default store checkbox is selected, and
   * populates the category autocomplete input when visible.
   */
  async assignStoreAndCategory(categoryName: string): Promise<void> {
    await this.ensureDefaultStoreChecked();

    const categoryInput = this.page
      .locator('#input-category, input[name*="category" i][type="text"]')
      .filter({ visible: true })
      .first();

    if (await categoryInput.isVisible().catch(() => false)) {
      await categoryInput.click();
      await categoryInput.fill(categoryName);
    }
  }

  /**
   * Opens the Image tab when present and attaches a file via a direct file
   * input or opens the upload/file-manager modal trigger. Returns `false` if
   * no upload control is exposed on the current build.
   */
  async uploadProductImage(filePath: string): Promise<boolean> {
    const imageTab = this.page
      .getByRole('tab', { name: /^Image$/i })
      .or(this.page.locator('a[href="#tab-image"]'))
      .first();

    if (await imageTab.isVisible().catch(() => false)) {
      await imageTab.click();
    }

    const fileInput = this.page.locator('input[type="file"]').first();
    if ((await fileInput.count()) > 0) {
      await fileInput.setInputFiles(filePath);
      return true;
    }

    const editImageBtn = this.page
      .locator('#tab-image button:has-text("Edit"), [role="tabpanel"] button:has-text("Edit")')
      .filter({ visible: true })
      .first();

    if (await editImageBtn.isVisible().catch(() => false)) {
      const fileChooserPromise = this.page.waitForEvent('filechooser', { timeout: 3000 }).catch(() => null);
      await editImageBtn.click();

      const fileChooser = await fileChooserPromise;
      if (fileChooser) {
        await fileChooser.setFiles(filePath);
        return true;
      }

      const activeOverlay = this.page
        .locator('.modal.show, [role="dialog"], .popover.show, input[type="file"]')
        .first();
      await expect(activeOverlay).toBeVisible({ timeout: 10000 });
      return true;
    }

    return false;
  }
}