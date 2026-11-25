// Admin authentication page object for OpenCart Admin login navigation and credential submission.
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { adminConfig } from '../config/env.config';

/**
 * Models the OpenCart Admin sign-in page, including navigation to the admin
 * entry URL, Cloudflare challenge detection, and session authentication.
 */
export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  /**
   * Initializes locators for the username field, password field, and submit button.
   */
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

  /**
   * Opens the configured admin base URL, checks for Cloudflare security
   * challenge pages, and verifies that the username field is visible.
   */
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

  /**
   * Submits administrator credentials (defaulting to environment configuration)
   * and waits for navigation to the dashboard with an active session token.
   */
  async login(
    username: string = adminConfig.username,
    password: string = adminConfig.password
  ): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();

    await Promise.race([
      this.page.waitForURL(
        /user_token=|route=common\/dashboard/i,
        { timeout: 15000 }
      ),
      this.usernameInput.waitFor({
        state: 'hidden',
        timeout: 15000
      }),
    ]);
  }
}