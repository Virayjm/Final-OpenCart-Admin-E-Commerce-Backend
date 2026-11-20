// Shared navigation, alert banners, user_token helpers
import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly alertBanner: Locator;
  readonly sidebarMenu: Locator;
  readonly securityModal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.alertBanner = page.locator('.alert');
    this.sidebarMenu = page.locator('#column-left');
    this.securityModal = page.locator('#modal-security');
  }

  getUserToken(): string {
    const url = new URL(this.page.url());
    return url.searchParams.get('user_token') ?? '';
  }

  async dismissSecurityModalIfVisible(): Promise<void> {
    if (await this.securityModal.isVisible().catch(() => false)) {
      const closeBtn = this.securityModal
        .locator('button.btn-close, [data-bs-dismiss="modal"], button:has-text("Close")')
        .first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      } else {
        await this.page.keyboard.press('Escape');
      }
      await expect(this.securityModal).toBeHidden({ timeout: 10000 });
    }
  }

  async gotoRoute(route: string): Promise<void> {
    await this.dismissSecurityModalIfVisible();
    const token = this.getUserToken();
    const separator = route.includes('?') ? '&' : '?';
    const target = token
      ? `index.php?route=${route}${separator}user_token=${encodeURIComponent(token)}`
      : `index.php?route=${route}`;
    await this.page.goto(target, { waitUntil: 'domcontentloaded' });
    await this.dismissSecurityModalIfVisible();
  }

  async navigateSidebar(topMenuText: string, subMenuText?: string): Promise<void> {
    await this.dismissSecurityModalIfVisible();
    const topItem = this.sidebarMenu.locator('a', { hasText: topMenuText }).first();
    await topItem.click();

    if (subMenuText) {
      const subItem = this.sidebarMenu.locator('a', { hasText: subMenuText }).first();
      await expect(subItem).toBeVisible();
      await subItem.click();
    }
    await this.page.waitForLoadState('domcontentloaded');
    await this.dismissSecurityModalIfVisible();
  }

  async expectSuccessAlert(expectedSubstring?: string): Promise<void> {
    const successAlert = this.page.locator('#alert .alert-success, .alert-success').first();
    await expect(successAlert).toBeVisible();
    if (expectedSubstring) {
      await expect(successAlert).toContainText(expectedSubstring);
    }
  }
}