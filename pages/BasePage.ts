import { Page, Locator, expect } from '@playwright/test';

/**
 * BasePage provides shared browser navigation, security modal handling,
 * session token extraction, and alert verification utilities inherited by
 * OpenCart Admin page objects.
 */
export class BasePage {
  readonly page: Page;
  readonly alertBanner: Locator;
  readonly sidebarMenu: Locator;
  readonly securityModal: Locator;

  /**
   * Initializes shared Playwright locators for alert banners, the left
   * navigation sidebar, and the OpenCart security notification modal.
   */
  constructor(page: Page) {
    this.page = page;
    this.alertBanner = page.locator('.alert');
    this.sidebarMenu = page.locator('#column-left');
    this.securityModal = page.locator('#modal-security');
  }

  /**
   * Extracts the active `user_token` query parameter from the current URL.
   */
  getUserToken(): string {
    try {
      const url = new URL(this.page.url());
      return url.searchParams.get('user_token') ?? '';
    } catch {
      return '';
    }
  }

  /**
   * Dismisses the OpenCart security notification modal if it is displayed
   * so it does not block pointer interactions with underlying controls.
   */
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

  /**
   * Navigates directly to a specific OpenCart admin `route` while preserving
   * the current session `user_token` when available.
   */
  async gotoRoute(route: string): Promise<void> {
    await this.dismissSecurityModalIfVisible();

    const token = this.getUserToken();
    const target = new URL('index.php', this.page.url());

    target.search = '';
    target.searchParams.set('route', route);

    if (token) {
      target.searchParams.set('user_token', token);
    }

    await this.page.goto(target.toString(), {
      waitUntil: 'domcontentloaded',
    });

    await this.dismissSecurityModalIfVisible();
  }

  /**
   * Expands a top-level left sidebar category and optionally selects a
   * child navigation item.
   */
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

  /**
   * Asserts that a success alert banner is visible and optionally contains
   * expected confirmation text.
   */
  async expectSuccessAlert(expectedSubstring?: string): Promise<void> {
    const successAlert = this.page.locator('.alert-success');
    await expect(successAlert).toBeVisible();
    if (expectedSubstring) {
      await expect(successAlert).toContainText(expectedSubstring);
    }
  }
}