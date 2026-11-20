import { test, expect, APIRequestContext } from '@playwright/test';
import { adminConfig } from '../../config/env.config';

const ADMIN_BASE = adminConfig.baseURL;

async function isCloudflareBlocked(responseText: string, status: number): Promise<boolean> {
  return status === 403 && /just a moment|cloudflare|ray id/i.test(responseText);
}

function extractUserToken(input: string): string | null {
  try {
    const url = new URL(input, ADMIN_BASE);
    const paramToken = url.searchParams.get('user_token');
    if (paramToken) return paramToken;
  } catch {
    // Not a full URL; check regex below
  }
  const match = input.match(/[?&]user_token=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
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

  // Extract login_token if OpenCart 4 includes it in the form action
  const actionMatch = getBody.match(/route=common\/login\.login(?:&amp;|&)login_token=([a-zA-Z0-9]+)/i);
  const loginToken = actionMatch ? actionMatch[1] : '';
  const postUrl = loginToken
    ? `${ADMIN_BASE}index.php?route=common/login.login&login_token=${encodeURIComponent(loginToken)}`
    : `${ADMIN_BASE}index.php?route=common/login`;

  const authRes = await request.post(postUrl, {
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

  // 1. Check final URL query parameter
  let token = extractUserToken(authRes.url());

  // 2. OpenCart 4 often returns JSON { redirect: "...&user_token=..." }
  if (!token) {
    try {
      const json = JSON.parse(postBody);
      if (typeof json.redirect === 'string') {
        token = extractUserToken(json.redirect.replace(/&amp;/g, '&'));
      }
    } catch {
      // Response is HTML rather than JSON
    }
  }

  // 3. Fallback: fetch dashboard route directly if session cookie was set
  if (!token) {
    const dashRes = await request.get(`${ADMIN_BASE}index.php?route=common/dashboard`, {
      maxRedirects: 5,
    });
    token = extractUserToken(dashRes.url());
  }

  return { token, blockedByCloudflare: false };
}

test.describe('OpenCart Admin - Backend Endpoint API Tests', () => {
  test('TC-API-01: Login endpoint authenticates and issues user_token', async ({ request }) => {
    const { token, blockedByCloudflare } = await getAuthenticatedToken(request);
    test.skip(blockedByCloudflare, 'Skipped: Blocked by Cloudflare challenge.');
    expect(token).toBeTruthy();
  });

  test('TC-API-02: Protected catalog endpoint rejects invalid user_token', async ({ request }) => {
    const res = await request.get(
      `${ADMIN_BASE}index.php?route=catalog/product&user_token=invalid_token_12345`,
      { maxRedirects: 0 }
    );
    const body = await res.text().catch(() => '');

    test.skip(
      await isCloudflareBlocked(body, res.status()),
      'Skipped: Blocked by Cloudflare challenge.'
    );

    expect([200, 302, 303, 401, 403]).toContain(res.status());
    if (res.status() === 200) {
      expect(body).toMatch(/login|permission|username|error/i);
    }
  });

  test('TC-API-03: Authenticated request context fetches Catalog > Products endpoint', async ({
    request,
  }) => {
    const { token, blockedByCloudflare } = await getAuthenticatedToken(request);
    test.skip(blockedByCloudflare || !token, 'Skipped: No user_token available.');

    const route = 'catalog/product';
    const productsRes = await request.get(
      `${ADMIN_BASE}index.php?route=${route}&user_token=${encodeURIComponent(token!)}`
    );

    expect(productsRes.status()).toBe(200);
    const html = await productsRes.text();
    expect(html.toLowerCase()).toContain('product');
  });

  test('TC-API-04: Authenticated request context fetches Sales > Orders endpoint', async ({
    request,
  }) => {
    const { token, blockedByCloudflare } = await getAuthenticatedToken(request);
    test.skip(blockedByCloudflare || !token, 'Skipped: No user_token available.');

    const ordersRes = await request.get(
      `${ADMIN_BASE}index.php?route=sale/order&user_token=${encodeURIComponent(token!)}`
    );

    expect(ordersRes.status()).toBe(200);
    const html = await ordersRes.text();
    expect(html.toLowerCase()).toContain('order');
  });
});