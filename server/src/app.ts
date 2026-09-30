import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	SESSION_COOKIE,
	isAllowed,
	isRecentSignIn,
	isSameOrigin,
	safeNext,
	type Claims,
} from './policy.ts';

// The slice of firebase-admin's Auth this app uses — injected so tests can fake it.
export interface AuthClient {
	verifyIdToken(idToken: string): Promise<Claims>;
	createSessionCookie(idToken: string, options: { expiresIn: number }): Promise<string>;
	verifySessionCookie(cookie: string): Promise<Claims>;
}

export interface AppOptions {
	auth: AuthClient;
	allowlist: Set<string>;
	publicOrigin: string; // e.g. https://wiki.glitch-cloud.com
	siteDir: string; // built Starlight site (dist/)
	loginHtml: string; // login page with the Firebase web config already filled in
	sessionDays?: number;
}

export function createApp(options: AppOptions): Hono {
	const { auth, allowlist, publicOrigin, siteDir, loginHtml } = options;
	const sessionMs = (options.sessionDays ?? 5) * 24 * 60 * 60 * 1000;
	const notFoundHtml = readOptional(join(siteDir, '404.html'));
	const app = new Hono();

	// Every response is per-user: never let the Firebase Hosting CDN (or a browser) cache it.
	app.use('*', async (c, next) => {
		await next();
		c.header('Cache-Control', 'private, no-store');
		c.header('X-Content-Type-Options', 'nosniff');
		c.header('X-Frame-Options', 'DENY');
		c.header('Referrer-Policy', 'same-origin');
	});

	app.get('/__auth/login', (c) => c.html(loginHtml));

	app.post('/__auth/session', async (c) => {
		if (!isSameOrigin(c.req.header('Origin'), publicOrigin)) return c.text('Forbidden', 403);
		const body = await c.req.json<{ idToken?: unknown }>().catch(() => ({ idToken: undefined }));
		if (typeof body.idToken !== 'string') return c.text('Bad request', 400);
		try {
			const claims = await auth.verifyIdToken(body.idToken);
			if (!isRecentSignIn(claims, Date.now() / 1000)) return c.text('Recent sign-in required', 401);
			if (!isAllowed(claims, allowlist)) return c.text('Not allowed', 403);
			const cookie = await auth.createSessionCookie(body.idToken, { expiresIn: sessionMs });
			setCookie(c, SESSION_COOKIE, cookie, {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'Lax', // Lax, not Strict: links from other sites (e.g. ClickUp) keep working
				maxAge: sessionMs / 1000,
			});
			return c.body(null, 204);
		} catch {
			return c.text('Unauthorized', 401);
		}
	});

	app.get('/__auth/logout', (c) => {
		deleteCookie(c, SESSION_COOKIE, { path: '/', secure: true });
		return c.redirect('/__auth/login');
	});

	// Everything else requires a valid session from an allowlisted account. The allowlist is
	// checked on every request, so removing an email takes effect immediately.
	app.use('*', async (c, next) => {
		const cookie = getCookie(c, SESSION_COOKIE);
		const claims = cookie ? await auth.verifySessionCookie(cookie).catch(() => undefined) : undefined;
		if (claims && isAllowed(claims, allowlist)) return next();
		const nextPath = safeNext(c.req.path + (new URL(c.req.url).search || ''));
		return c.redirect(`/__auth/login?next=${encodeURIComponent(nextPath)}`);
	});

	app.use('*', serveStatic({ root: siteDir }));
	app.notFound((c) => (notFoundHtml ? c.html(notFoundHtml, 404) : c.text('Not found', 404)));

	return app;
}

function readOptional(path: string): string | undefined {
	try {
		return readFileSync(path, 'utf8');
	} catch {
		return undefined;
	}
}
