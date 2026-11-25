// Administrative dashboard page object for OpenCart Admin KPI widgets, load verification, and session logout.
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Models the OpenCart Admin Dashboard view (`route=common/dashboard`), handling
 * dashboard load verification, security modal dismissal, and session sign-out.
 */
export class DashboardPage extends BasePage {
  readonly pageHeading: Locator;
  readonly tileWidgets: Locator;
  readonly logoutLink: Locator;

  /**
   * Initializes locators for the dashboard heading, metric tile/card widgets,
   * and administrator logout link.
   */
  constructor(page: Page) {
    super(page);
    this.pageHeading = page.locator('#content h1');
    this.tileWidgets = page.locator('.tile, .card');
    this.logoutLink = page.locator('a[href*="route=common/logout"], #nav-logout a');
  }

  /**
   * Verifies that the browser is on the dashboard route with a non-empty
   * `user_token`, dismisses any visible security modal, and confirms the
   * Dashboard heading is displayed.
   */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/route=common\/dashboard/i);
    expect(this.getUserToken()).not.toBe('');
    await this.dismissSecurityModalIfVisible();
    await expect(this.pageHeading).toContainText(/Dashboard/i);
  }

  /**
   * Dismisses any blocking modal, clicks the logout link, and verifies that the
   * session returns to the login route (`route=common/login`).
   */
  async logout(): Promise<void> {
    await this.dismissSecurityModalIfVisible();
    await this.logoutLink.first().click();
    await expect(this.page).toHaveURL(/route=common\/login/i);
  }
}