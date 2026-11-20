// Shared navigation, alert banners, user_token helpers
import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly alertBanner: Locator;
  readonly sidebarMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.alertBanner = page.locator('.alert');
    this.sidebarMenu = page.locator('#column-left');
  }

  getUserToken(): string {
    const url = new URL(this.page.url());
    return url.searchParams.get('user_token') ?? '';
  }

  async gotoRoute(route: string): Promise<void> {
    const token = this.getUserToken();
    const separator = route.includes('?') ? '&' : '?';
    const target = token
      ? `index.php?route=${route}${separator}user_token=${encodeURIComponent(token)}`
      : `index.php?route=${route}`;
    await this.page.goto(target);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async navigateSidebar(topMenuText: string, subMenuText?: string): Promise<void> {
    const topItem = this.sidebarMenu.locator('a', { hasText: topMenuText }).first();
    await topItem.click();

    if (subMenuText) {
      const subItem = this.sidebarMenu.locator('a', { hasText: subMenuText }).first();
      await expect(subItem).toBeVisible();
      await subItem.click();
    }
    await this.page.waitForLoadState('networkidle');
  }

  async expectSuccessAlert(expectedSubstring?: string): Promise<void> {
    const successAlert = this.page.locator('.alert-success');
    await expect(successAlert).toBeVisible();
    if (expectedSubstring) {
      await expect(successAlert).toContainText(expectedSubstring);
    }
  }
}