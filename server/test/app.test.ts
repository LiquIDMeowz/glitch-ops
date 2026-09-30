import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp, type AuthClient } from '../src/app.ts';
import { parseAllowlist, type Claims } from '../src/policy.ts';

const ORIGIN = 'https://wiki.example.com';
const now = () => Math.floor(Date.now() / 1000);

// Fake Firebase: tokens and cookies are just keys into a table of claims.
function fakeAuth(tokens: Record<string, Claims>): AuthClient {
	return {
		verifyIdToken: async (token) => tokens[token] ?? Promise.reject(new Error('invalid token')),
		createSessionCookie: async (token) => `cookie-for-${token}`,
		verifySessionCookie: async (cookie) =>
			tokens[cookie.replace('cookie-for-', '')] ?? Promise.reject(new Error('invalid cookie')),
	};
}

function makeApp() {
	const siteDir = mkdtempSync(join(tmpdir(), 'site-'));
	writeFileSync(join(siteDir, 'index.html'), '<h1>wiki home</h1>');
	writeFileSync(join(siteDir, '404.html'), '<h1>not here</h1>');
	return createApp({
		auth: fakeAuth({
			good: { email: 'a@x.com', email_verified: true, auth_time: now() },
			stale: { email: 'a@x.com', email_verified: true, auth_time: now() - 3600 },
			stranger: { email: 'c@x.com', email_verified: true, auth_time: now() },
		}),
		allowlist: parseAllowlist('a@x.com'),
		publicOrigin: ORIGIN,
		siteDir,
		loginHtml: '<p>login</p>',
	});
}

const session = (token: string, origin = ORIGIN) =>
	new Request('http://localhost/__auth/session', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Origin: origin },
		body: JSON.stringify({ idToken: token }),
	});

describe('protected pages', () => {
	it('redirect to login without a session, keeping the path', async () => {
		const res = await makeApp().request('/runbooks/x/');
		expect(res.status).toBe(302);
		expect(res.headers.get('Location')).toBe('/__auth/login?next=%2Frunbooks%2Fx%2F');
		expect(res.headers.get('Cache-Control')).toBe('private, no-store');
	});

	it('are served with a valid session from an allowlisted account', async () => {
		const res = await makeApp().request('/', { headers: { Cookie: '__session=cookie-for-good' } });
		expect(res.status).toBe(200);
		expect(await res.text()).toContain('wiki home');
		expect(res.headers.get('Cache-Control')).toBe('private, no-store');
	});

	it('are refused when the account is no longer allowlisted', async () => {
		const res = await makeApp().request('/', { headers: { Cookie: '__session=cookie-for-stranger' } });
		expect(res.status).toBe(302);
	});

	it('return the site 404 page for unknown paths when signed in', async () => {
		const res = await makeApp().request('/nope/', { headers: { Cookie: '__session=cookie-for-good' } });
		expect(res.status).toBe(404);
		expect(await res.text()).toContain('not here');
	});
});

describe('POST /__auth/session', () => {
	it('sets an HttpOnly, Secure, Lax __session cookie for a fresh allowlisted sign-in', async () => {
		const res = await makeApp().request(session('good'));
		expect(res.status).toBe(204);
		const cookie = res.headers.get('Set-Cookie') ?? '';
		expect(cookie).toContain('__session=cookie-for-good');
		expect(cookie).toContain('HttpOnly');
		expect(cookie).toContain('Secure');
		expect(cookie).toContain('SameSite=Lax');
	});

	it('rejects other origins (CSRF)', async () => {
		expect((await makeApp().request(session('good', 'https://evil.com'))).status).toBe(403);
	});

	it('rejects stale sign-ins, strangers and bad tokens', async () => {
		const app = makeApp();
		expect((await app.request(session('stale'))).status).toBe(401);
		expect((await app.request(session('stranger'))).status).toBe(403);
		expect((await app.request(session('forged'))).status).toBe(401);
	});
});

describe('login page', () => {
	it('is reachable without a session', async () => {
		const res = await makeApp().request('/__auth/login');
		expect(res.status).toBe(200);
		expect(await res.text()).toContain('login');
	});
});
