import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { LoginPage } from './LoginPage';
import { adminConfig } from '../config/env.config';

export class UserGroupPage extends BasePage {
  readonly contentContainer: Locator;
  readonly editGroupButton: Locator;
  readonly permissionCheckboxes: Locator;

  constructor(page: Page) {
    super(page);
    this.contentContainer = page.locator('#content');
    this.editGroupButton = page
      .locator('a[href*="user_permission.form"]')
      .first();
    this.permissionCheckboxes = page.locator(
      'input[type="checkbox"][name*="permission" i]'
    );
  }

  async open(): Promise<void> {
    const loginPage = new LoginPage(this.page);
    const loginInput = this.page
      .locator('#input-username, input[name="username"]')
      .first();

    await this.dismissSecurityModalIfVisible();

    if (await loginInput.isVisible().catch(() => false)) {
      await loginPage.login(adminConfig.username, adminConfig.password);
      await expect(loginInput).toBeHidden({ timeout: 15000 });
    }

    await this.gotoRoute('user/user_permission');
    await this.dismissSecurityModalIfVisible();

    await expect(this.page).not.toHaveURL(/route=common\/login/i);
    await expect(this.contentContainer).toContainText(/User Groups?/i, {
      timeout: 15000,
    });
  }

  async openFirstGroupAndCountPermissions(): Promise<number> {
    if (await this.editGroupButton.isVisible().catch(() => false)) {
      await this.editGroupButton.click();
      await this.page.waitForLoadState('domcontentloaded');
      await this.dismissSecurityModalIfVisible();
      return this.permissionCheckboxes.count();
    }
    return 0;
  }
}