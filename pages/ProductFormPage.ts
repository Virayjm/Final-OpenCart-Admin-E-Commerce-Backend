// Add/Edit multi-tab product form (General, Data, etc.)
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface ProductPayload {
  name: string;
  metaTitle: string;
  model: string;
  price?: string;
}

export class ProductFormPage extends BasePage {
  readonly saveButton: Locator;
  readonly generalTab: Locator;
  readonly dataTab: Locator;
  readonly productNameInput: Locator;
  readonly metaTitleInput: Locator;
  readonly modelInput: Locator;
  readonly priceInput: Locator;

  constructor(page: Page) {
    super(page);
    this.saveButton = page.locator('button[type="submit"], button[data-bs-original-title="Save"], button[title="Save"]').first();
    this.generalTab = page.locator('a[href="#tab-general"], a[href="#tab-language"]').first();
    this.dataTab = page.locator('a[href="#tab-data"]').first();
    this.productNameInput = page.locator('input[name*="product_description"][name$="[name]"]').first();
    this.metaTitleInput = page.locator('input[name*="product_description"][name$="[meta_title]"]').first();
    this.modelInput = page.locator('#input-model');
    this.priceInput = page.locator('#input-price');
  }

  async fillGeneralAndData(payload: ProductPayload): Promise<void> {
    if (await this.generalTab.isVisible()) {
      await this.generalTab.click();
    }
    await this.productNameInput.fill(payload.name);
    await this.metaTitleInput.fill(payload.metaTitle);

    if (await this.dataTab.isVisible()) {
      await this.dataTab.click();
    }
    await this.modelInput.fill(payload.model);

    if (payload.price !== undefined && (await this.priceInput.isVisible())) {
      await this.priceInput.fill(payload.price);
    }
  }

  async updateModel(newModel: string): Promise<void> {
    if (await this.dataTab.isVisible()) {
      await this.dataTab.click();
    }
    await this.modelInput.fill(newModel);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
    await this.expectSuccessAlert();
  }
}