import { serve } from '@hono/node-server';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'node:fs';
import { createApp } from './app.ts';
import { parseAllowlist } from './policy.ts';

function required(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`missing environment variable ${name}`);
	return value;
}

// On Cloud Run firebase-admin uses the service's own identity (ADC); the project comes from
// GOOGLE_CLOUD_PROJECT.
initializeApp({ projectId: required('GOOGLE_CLOUD_PROJECT') });

// Public by design (it identifies the Firebase project to the browser), so it's plain config.
const firebaseConfig = {
	apiKey: required('FIREBASE_API_KEY'),
	authDomain: required('FIREBASE_AUTH_DOMAIN'),
	projectId: required('GOOGLE_CLOUD_PROJECT'),
};
const loginHtml = readFileSync(new URL('./login.html', import.meta.url), 'utf8').replace(
	'__FIREBASE_CONFIG__',
	JSON.stringify(firebaseConfig),
);

const allowlist = parseAllowlist(required('ALLOWED_EMAILS'));

const app = createApp({
	auth: getAuth(),
	allowlist,
	publicOrigin: required('PUBLIC_ORIGIN'),
	siteDir: process.env.SITE_DIR ?? './site',
	loginHtml,
});

const port = Number(process.env.PORT ?? 8080);
serve({ fetch: app.fetch, port }, () => {
	// No emails in logs: only the size of the allowlist.
	console.log(JSON.stringify({ severity: 'INFO', message: `listening on ${port}`, allowlistSize: allowlist.size }));
});
