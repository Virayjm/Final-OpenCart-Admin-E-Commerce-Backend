// KPI cards, charts/map checks, sidebar navigation
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly pageHeading: Locator;
  readonly tileWidgets: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading = page.locator('#content h1');
    this.tileWidgets = page.locator('.tile');
    this.logoutLink = page.locator('a[href*="route=common/logout"], #nav-logout a');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/route=common\/dashboard/);
    expect(this.getUserToken()).not.toBe('');
    await expect(this.pageHeading).toContainText(/Dashboard/i);
    await expect(this.tileWidgets.first()).toBeVisible();
  }

  async logout(): Promise<void> {
    await this.logoutLink.first().click();
    await expect(this.page).toHaveURL(/route=common\/login/);
  }
}