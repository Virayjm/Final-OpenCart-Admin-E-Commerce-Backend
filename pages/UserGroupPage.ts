// System > Users > User Groups page object for RBAC group listing and permission control inspection.
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { LoginPage } from './LoginPage';
import { adminConfig } from '../config/env.config';

/**
 * Models the OpenCart Admin User Groups and Role-Based Access Control (RBAC)
 * permission management view (`route=user/user_group`), handling session
 * authentication, route fallback, and group permission checks.
 */
export class UserGroupPage extends BasePage {
  readonly contentContainer: Locator;
  readonly editGroupButton: Locator;
  readonly permissionCheckboxes: Locator;

  /**
   * Initializes locators for the user group table/form container, the Edit
   * group action control, and permission checkboxes.
   */
  constructor(page: Page) {
    super(page);
    this.contentContainer = page.locator('table, form, .card-body').first();
    this.editGroupButton = page
      .locator('a[title*="Edit" i], a.btn-primary[href*="user_group"], button[title*="Edit" i]')
      .filter({ visible: true })
      .first();
    this.permissionCheckboxes = page.locator(
      'input[type="checkbox"][name*="permission" i], input[type="checkbox"]'
    );
  }

  /**
   * Ensures the admin session is authenticated, navigates to the User Groups
   * view (`user/user_group` with fallback to `user/user_group.list`), and
   * verifies that User Groups content is rendered.
   */
  async open(): Promise<void> {
    const loginPage = new LoginPage(this.page);
    const loginInput = this.page.locator('#input-username, input[name="username"]').first();

    if (!this.page.url().includes('index.php')) {
      await this.page.goto(adminConfig.baseURL, { waitUntil: 'domcontentloaded' });
    }

    await this.dismissSecurityModalIfVisible();

    if (
      /route=common\/login/i.test(this.page.url()) ||
      (await loginInput.isVisible().catch(() => false))
    ) {
      await loginPage.login(adminConfig.username, adminConfig.password);
      await this.page.waitForURL(/user_token=|route=common\/dashboard/i, { timeout: 15000 });
    }

    await this.gotoRoute('user/user_group');
    await this.dismissSecurityModalIfVisible();

    if (
      /route=common\/login/i.test(this.page.url()) ||
      (await loginInput.isVisible().catch(() => false))
    ) {
      await loginPage.login(adminConfig.username, adminConfig.password);
      await this.page.waitForURL(/user_token=/i, { timeout: 15000 });
      await this.gotoRoute('user/user_group');
      await this.dismissSecurityModalIfVisible();
    }

    if (!(await this.contentContainer.isVisible().catch(() => false))) {
      await this.gotoRoute('user/user_group.list');
      await this.dismissSecurityModalIfVisible();
    }

    await expect(this.page).not.toHaveURL(/route=common\/login/i);
    await expect(this.page.locator('body')).toContainText(
      /User Groups?|Permission|Demonstration|Administrator/i
    );
  }

  /**
   * Opens the first editable User Group form when available and returns the
   * total count of rendered permission checkboxes.
   */
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