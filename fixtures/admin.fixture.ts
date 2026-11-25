// Custom Playwright fixture injecting OpenCart Admin Page Objects and an authenticated session.
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ProductListPage } from '../pages/ProductListPage';
import { ProductFormPage } from '../pages/ProductFormPage';
import { OrderListPage } from '../pages/OrderListPage';
import { UserGroupPage } from '../pages/UserGroupPage';

export interface AdminFixtures {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  productListPage: ProductListPage;
  productFormPage: ProductFormPage;
  orderListPage: OrderListPage;
  userGroupPage: UserGroupPage;
  authenticatedDashboard: DashboardPage;
}

export const test = base.extend<AdminFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  productListPage: async ({ page }, use) => {
    await use(new ProductListPage(page));
  },
  productFormPage: async ({ page }, use) => {
    await use(new ProductFormPage(page));
  },
  orderListPage: async ({ page }, use) => {
    await use(new OrderListPage(page));
  },
  userGroupPage: async ({ page }, use) => {
    await use(new UserGroupPage(page));
  },
  authenticatedDashboard: async ({ loginPage, dashboardPage }, use) => {
    await loginPage.open();
    await loginPage.login();
    await dashboardPage.expectLoaded();
    await use(dashboardPage);
  },
});

export { expect } from '@playwright/test';