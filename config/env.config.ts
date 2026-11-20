// Base URL, admin credentials, timeouts
export interface AdminConfig {
  baseURL: string;
  username: string;
  password: string;
  actionTimeout: number;
  navigationTimeout: number;
  expectTimeout: number;
}

function normalizeBaseUrl(rawUrl: string): string {
  return rawUrl.endsWith('/') ? rawUrl : `${rawUrl}/`;
}

export const adminConfig: AdminConfig = {
  baseURL: normalizeBaseUrl(
    process.env.OPENCART_ADMIN_URL ?? 'https://demo.opencart.com/TlbeVW/'
  ),
  username: process.env.OPENCART_ADMIN_USER ?? 'demo',
  password: process.env.OPENCART_ADMIN_PASS ?? 'demo',
  actionTimeout: 15000,
  navigationTimeout: 25000,
  expectTimeout: 15000,
};