// Sales > Orders management page object for date-range filtering and order table verification.
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Models the OpenCart Admin Sales > Orders screen (`route=sale/order`),
 * encapsulating date-added/date-range filter inputs, filter submission, and
 * order grid visibility checks.
 */
export class OrderListPage extends BasePage {
  readonly dateFromInput: Locator;
  readonly dateToInput: Locator;
  readonly filterButton: Locator;
  readonly orderTableOrCard: Locator;

  /**
   * Initializes locators for order date filter fields, the Filter action
   * button, and the orders results table container.
   */
  constructor(page: Page) {
    super(page);
    this.dateFromInput = page
      .locator(
        '#input-date-added-from, #input-date-from, input[name*="date_added"][name*="from" i], input[name*="date_from" i], #filter-order input[type="date"], input[id*="date-added"], input[name*="date_added"]'
      )
      .filter({ visible: true })
      .first();
    this.dateToInput = page
      .locator(
        '#input-date-added-to, #input-date-to, input[name*="date_added"][name*="to" i], input[name*="date_to" i]'
      )
      .filter({ visible: true })
      .first();
    this.filterButton = page
      .locator('#button-filter, button:has-text("Filter"), input[type="button"][value*="Filter" i]')
      .filter({ visible: true })
      .first();
    this.orderTableOrCard = page
      .locator('form#form-order table, table.table, #form-order, .card-body')
      .first();
  }

  /**
   * Navigates directly to the Sales > Orders route and dismisses any blocking
   * security notification modal.
   */
  async open(): Promise<void> {
    await this.gotoRoute('sale/order');
    await this.dismissSecurityModalIfVisible();
  }

  /**
   * Checks whether a visible Date From / Date Added filter field exists on the
   * current OpenCart build.
   */
  async hasVisibleDateFilter(): Promise<boolean> {
    return this.dateFromInput.isVisible().catch(() => false);
  }

  /**
   * Populates available start and end date filter fields and submits the
   * filter request.
   */
  async filterByDateRange(fromIso: string, toIso: string): Promise<void> {
    await expect(this.dateFromInput).toBeVisible();
    await this.dateFromInput.fill(fromIso);

    if (await this.dateToInput.isVisible().catch(() => false)) {
      await this.dateToInput.fill(toIso);
    }

    if (await this.filterButton.isVisible().catch(() => false)) {
      await this.filterButton.click();
      await this.page.waitForLoadState('domcontentloaded');
      await this.dismissSecurityModalIfVisible();
    }

    await expect(this.orderTableOrCard).toBeVisible();
  }
}