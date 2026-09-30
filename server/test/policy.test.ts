import { describe, expect, it } from 'vitest';
import { isAllowed, isRecentSignIn, isSameOrigin, parseAllowlist, safeNext } from '../src/policy.ts';

describe('parseAllowlist', () => {
	it('trims, lower-cases and drops empty entries', () => {
		expect(parseAllowlist(' A@x.com, ,b@y.com ')).toEqual(new Set(['a@x.com', 'b@y.com']));
	});
	it('is empty when unset', () => {
		expect(parseAllowlist(undefined).size).toBe(0);
	});
});

describe('isAllowed', () => {
	const allowlist = parseAllowlist('a@x.com');
	it('allows a verified allowlisted email, case-insensitively', () => {
		expect(isAllowed({ email: 'A@X.com', email_verified: true }, allowlist)).toBe(true);
	});
	it('rejects unverified emails', () => {
		expect(isAllowed({ email: 'a@x.com', email_verified: false }, allowlist)).toBe(false);
	});
	it('rejects emails not on the list and missing emails', () => {
		expect(isAllowed({ email: 'c@x.com', email_verified: true }, allowlist)).toBe(false);
		expect(isAllowed({ email_verified: true }, allowlist)).toBe(false);
	});
});

describe('isRecentSignIn', () => {
	it('accepts sign-ins under 5 minutes old only', () => {
		expect(isRecentSignIn({ auth_time: 1000 }, 1000 + 299)).toBe(true);
		expect(isRecentSignIn({ auth_time: 1000 }, 1000 + 300)).toBe(false);
		expect(isRecentSignIn({}, 1000)).toBe(false);
	});
});

describe('isSameOrigin', () => {
	it('requires an exact origin match', () => {
		expect(isSameOrigin('https://wiki.example.com', 'https://wiki.example.com')).toBe(true);
		expect(isSameOrigin('https://evil.example.com', 'https://wiki.example.com')).toBe(false);
		expect(isSameOrigin(undefined, 'https://wiki.example.com')).toBe(false);
	});
});

describe('safeNext', () => {
	it('keeps same-site paths', () => {
		expect(safeNext('/runbooks/x/?a=1')).toBe('/runbooks/x/?a=1');
	});
	it('falls back to / for anything that could leave the site', () => {
		for (const bad of [undefined, '', 'https://evil.com', '//evil.com', '/\\evil.com', 'runbooks']) {
			expect(safeNext(bad)).toBe('/');
		}
	});
});
