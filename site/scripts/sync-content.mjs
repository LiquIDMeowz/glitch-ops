// Copies the wiki pages from the private glitch-ops-content repo into src/content/docs.
// This repo is public, so it holds no pages itself: CI checks the content repo out and sets
// CONTENT_DIR; locally the content repo is expected next to glitch-ops. Without content, a
// placeholder page is used so the site still builds.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(siteDir, 'src/content/docs');
const source = resolve(process.env.CONTENT_DIR ?? resolve(siteDir, '../../glitch-ops-content/docs'));

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

if (existsSync(source)) {
	cpSync(source, target, { recursive: true });
	// No file names: page paths and titles must not appear in public CI logs.
	console.log('content: synced from content repo');
} else {
	cpSync(resolve(siteDir, 'placeholder'), target, { recursive: true });
	console.log('content: content repo not found, using placeholder page');
}
