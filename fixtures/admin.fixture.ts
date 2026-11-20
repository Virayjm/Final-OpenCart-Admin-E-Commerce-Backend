import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ProductListPage } from '../pages/ProductListPage';
import { ProductFormPage } from '../pages/ProductFormPage';
import { adminConfig } from '../config/env.config';

type AdminFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  productListPage: ProductListPage;
  productFormPage: ProductFormPage;
  authenticatedDashboard: DashboardPage;
};

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
  authenticatedDashboard: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login(adminConfig.username, adminConfig.password);
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.expectLoaded();
    await use(dashboardPage);
  },
});

export { expect } from '@playwright/test';