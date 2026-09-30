// Pure access-control rules, kept free of I/O so they can be unit-tested.

export const SESSION_COOKIE = '__session'; // the only cookie Firebase Hosting forwards to Cloud Run
export const RECENT_SIGN_IN_SECONDS = 5 * 60;

export function parseAllowlist(raw: string | undefined): Set<string> {
	return new Set(
		(raw ?? '')
			.split(',')
			.map((email) => email.trim().toLowerCase())
			.filter(Boolean),
	);
}

export interface Claims {
	email?: string;
	email_verified?: boolean;
	auth_time?: number;
}

export function isAllowed(claims: Claims, allowlist: Set<string>): boolean {
	return Boolean(claims.email && claims.email_verified && allowlist.has(claims.email.toLowerCase()));
}

// Session cookies are only minted right after a sign-in, so a stolen older ID token can't be
// exchanged for a long-lived cookie (Firebase's recommendation for sensitive apps).
export function isRecentSignIn(claims: Claims, nowSeconds: number): boolean {
	return typeof claims.auth_time === 'number' && nowSeconds - claims.auth_time < RECENT_SIGN_IN_SECONDS;
}

// The session endpoint only accepts requests whose Origin is the wiki itself (CSRF guard; the
// cookie is also SameSite=Lax).
export function isSameOrigin(originHeader: string | undefined, publicOrigin: string): boolean {
	return originHeader === publicOrigin;
}

// Only same-site absolute paths are valid post-login targets — no open redirects.
export function safeNext(next: string | undefined): string {
	if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/';
	return next;
}
