import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { adminConfig } from '../config/env.config';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page
      .locator('#input-username, input[name="username"]')
      .first();
    this.passwordInput = page
      .locator('#input-password, input[name="password"]')
      .first();
    this.loginButton = page
      .locator('button[type="submit"], input[type="submit"]')
      .first();
  }

  async open(): Promise<void> {
    await this.page.goto('', { waitUntil: 'domcontentloaded' });

    const title = await this.page.title().catch(() => '');
    if (/just a moment|attention required|cloudflare/i.test(title)) {
      throw new Error(
        `Blocked by Cloudflare challenge ("${title}") at ${this.page.url()}. Use a local/unblocked OpenCart URL via OPENCART_ADMIN_URL.`
      );
    }

    await expect(this.usernameInput).toBeVisible();
  }

  async login(
    username: string = adminConfig.username,
    password: string = adminConfig.password
  ): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await Promise.all([
      this.page.waitForURL(/user_token=|route=common\/dashboard/i),
      this.loginButton.click(),
    ]);
  }
}