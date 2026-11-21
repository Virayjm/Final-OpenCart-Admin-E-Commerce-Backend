import { test, expect, APIRequestContext } from '@playwright/test';
import { adminConfig } from '../../config/env.config';

const ADMIN_BASE = adminConfig.baseURL;

function extractUserToken(input: string): string | null {
  try {
    const url = new URL(input, ADMIN_BASE);
    const paramToken = url.searchParams.get('user_token');
    if (paramToken) return paramToken;
  } catch {
    // Not a full URL; fall back to regex match
  }
  const match = input.match(/[?&]user_token=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

async function tryAuthenticate(request: APIRequestContext): Promise<string | null> {
  const loginGet = await request.get(`${ADMIN_BASE}index.php?route=common/login`);
  if (loginGet.status() !== 200) {
    return null;
  }

  const getBody = await loginGet.text().catch(() => '');
  const actionMatch = getBody.match(
    /route=common\/login\.login(?:&amp;|&)login_token=([a-zA-Z0-9]+)/i
  );
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
  let token = extractUserToken(authRes.url());

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

  if (!token) {
    const dashRes = await request.get(`${ADMIN_BASE}index.php?route=common/dashboard`, {
      maxRedirects: 5,
    });
    token = extractUserToken(dashRes.url());
  }

  return token;
}

test.describe('OpenCart Admin - Expanded & Negative Backend API Tests', () => {
  test('TC-API-05 [Auth Guard]: Protected admin route without user_token blocks or redirects', async ({
    request,
  }) => {
    const res = await request.get(`${ADMIN_BASE}index.php?route=catalog/product`, {
      maxRedirects: 0,
    });

    expect([200, 302, 303, 401, 403]).toContain(res.status());

    if (res.status() === 200) {
      const body = await res.text();
      expect(body).toMatch(/login|permission|username|error/i);
    }
  });

  test('TC-API-06 [Negative Route]: Non-existent admin route does not cause an unhandled 500 crash', async ({
    request,
  }) => {
    const token = await tryAuthenticate(request);
    const query = token
      ? `route=catalog/nonexistent_qa_probe&user_token=${encodeURIComponent(token)}`
      : `route=catalog/nonexistent_qa_probe`;

    const res = await request.get(`${ADMIN_BASE}index.php?${query}`, {
      maxRedirects: 5,
    });

    expect(res.status()).toBeLessThan(500);
    const body = await res.text();
    expect(body.length).toBeGreaterThan(0);
  });

  test('TC-API-07 [Malicious / Special Payload]: Special & script-like query input is not reflected unescaped', async ({
    request,
  }) => {
    const token = await tryAuthenticate(request);
    const probe = `<script>alert(1)</script>`;
    const url = token
      ? `${ADMIN_BASE}index.php?route=catalog/product&user_token=${encodeURIComponent(token)}&filter_name=${encodeURIComponent(probe)}`
      : `${ADMIN_BASE}index.php?route=catalog/product&filter_name=${encodeURIComponent(probe)}`;

    const res = await request.get(url, { maxRedirects: 5 });
    expect(res.status()).toBeLessThan(500);

    const body = await res.text();
    expect(body).not.toContain('<script>alert(1)</script>');
  });

  test('TC-API-08 [Authenticated Endpoint]: Fetch Customers or User Groups endpoint with valid token', async ({
    request,
  }) => {
    const token = await tryAuthenticate(request);
    test.skip(!token, 'Skipping: No user_token issued in current environment.');

    const res = await request.get(
      `${ADMIN_BASE}index.php?route=customer/customer&user_token=${encodeURIComponent(token!)}`
    );

    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html.toLowerCase()).toContain('customer');
  });
});