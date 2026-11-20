import { test, expect, APIRequestContext } from '@playwright/test';
import { adminConfig } from '../../config/env.config';

const ADMIN_BASE = adminConfig.baseURL;

async function isCloudflareBlocked(responseText: string, status: number): Promise<boolean> {
  return status === 403 && /just a moment|cloudflare|ray id/i.test(responseText);
}

async function getAuthenticatedToken(request: APIRequestContext): Promise<{
  token: string | null;
  blockedByCloudflare: boolean;
}> {
  const loginGet = await request.get(`${ADMIN_BASE}index.php?route=common/login`);
  const getBody = await loginGet.text().catch(() => '');

  if (await isCloudflareBlocked(getBody, loginGet.status())) {
    return { token: null, blockedByCloudflare: true };
  }

  if (loginGet.status() !== 200) {
    return { token: null, blockedByCloudflare: false };
  }

  const authRes = await request.post(`${ADMIN_BASE}index.php?route=common/login`, {
    form: {
      username: adminConfig.username,
      password: adminConfig.password,
    },
    maxRedirects: 5,
  });

  const postBody = await authRes.text().catch(() => '');
  if (await isCloudflareBlocked(postBody, authRes.status())) {
    return { token: null, blockedByCloudflare: true };
  }

  const token = new URL(authRes.url()).searchParams.get('user_token');
  return { token, blockedByCloudflare: false };
}

test.describe('OpenCart Admin - Backend Endpoint API Tests', () => {
  test('TC-API-01: Login endpoint loads and issues user_token when accessible', async ({
    request,
  }) => {
    const { token, blockedByCloudflare } = await getAuthenticatedToken(request);
    test.skip(
      blockedByCloudflare,
      'Skipped: Cloudflare bot protection returned 403 on demo.opencart.com.'
    );

    expect(token).toBeTruthy();
  });

  test('TC-API-02: Protected catalog endpoint rejects invalid user_token', async ({
    request,
  }) => {
    const res = await request.get(
      `${ADMIN_BASE}index.php?route=catalog/product&user_token=invalid_token_12345`,
      { maxRedirects: 0 }
    );
    const body = await res.text().catch(() => '');

    test.skip(
      await isCloudflareBlocked(body, res.status()),
      'Skipped: Cloudflare bot protection returned 403 on demo.opencart.com.'
    );

    expect([200, 302, 303, 401]).toContain(res.status());
    if (res.status() === 200) {
      expect(body).toMatch(/login|permission|username/i);
    }
  });

  test('TC-API-03: Authenticated request context fetches Catalog > Products list', async ({
    request,
  }) => {
    const { token, blockedByCloudflare } = await getAuthenticatedToken(request);
    test.skip(
      blockedByCloudflare || !token,
      'Skipped: No user_token available (Cloudflare 403 or unreachable demo instance).'
    );

    const productsRes = await request.get(
      `${ADMIN_BASE}index.php?route=catalog/product&user_token=${encodeURIComponent(token!)}`
    );

    expect(productsRes.status()).toBe(200);
    const html = await productsRes.text();
    expect(html.toLowerCase()).toContain('product');
  });

  test('TC-API-04: Authenticated request context fetches Sales > Orders endpoint', async ({
    request,
  }) => {
    const { token, blockedByCloudflare } = await getAuthenticatedToken(request);
    test.skip(
      blockedByCloudflare || !token,
      'Skipped: No user_token available (Cloudflare 403 or unreachable demo instance).'
    );

    const ordersRes = await request.get(
      `${ADMIN_BASE}index.php?route=sale/order&user_token=${encodeURIComponent(token!)}`
    );

    expect(ordersRes.status()).toBe(200);
    const html = await ordersRes.text();
    expect(html.toLowerCase()).toContain('order');
  });
});