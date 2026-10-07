// Copies the wiki pages from the private glitch-ops-content repo into src/content/docs.
// This repo is public, so it holds no pages itself: CI checks the content repo out and sets
// CONTENT_DIR; locally the content repo is expected next to glitch-ops. Without content, a
// placeholder page is used so the site still builds.
//
// Module pages are generated from the public glitch-modules repo (MODULES_DIR, default
// ../../glitch-modules/modules): each module's README.md becomes landing-zone/modules/<name>.md,
// so module docs are written once, next to the code.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(siteDir, 'src/content/docs');
const source = resolve(process.env.CONTENT_DIR ?? resolve(siteDir, '../../glitch-ops-content/docs'));
const modules = resolve(process.env.MODULES_DIR ?? resolve(siteDir, '../../glitch-modules/modules'));

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

if (!existsSync(source)) {
	cpSync(resolve(siteDir, 'placeholder'), target, { recursive: true });
	console.log('content: content repo not found, using placeholder page');
	process.exit(0);
}

cpSync(source, target, { recursive: true });
// No file names: page paths and titles must not appear in public CI logs.
console.log('content: synced from content repo');

if (existsSync(modules) && existsSync(join(target, 'landing-zone'))) {
	const out = join(target, 'landing-zone', 'modules');
	mkdirSync(out, { recursive: true });
	const names = readdirSync(modules, { withFileTypes: true })
		.filter((e) => e.isDirectory() && existsSync(join(modules, e.name, 'README.md')))
		.map((e) => e.name)
		.sort();
	for (const [i, name] of names.entries()) {
		// The README's own "# name" heading is dropped: Starlight renders the title.
		const body = readFileSync(join(modules, name, 'README.md'), 'utf8').replace(/^#\s+.*\n+/, '');
		writeFileSync(
			join(out, `${name}.md`),
			`---\ntitle: ${JSON.stringify(name)}\nsidebar:\n  order: ${i + 1}\n---\n\n` +
				`Generated from [glitch-modules/modules/${name}](https://github.com/Vlad-Krastev/glitch-modules/tree/main/modules/${name}) — edit the README there.\n\n` +
				body,
		);
	}
	writeFileSync(
		join(out, 'index.md'),
		'---\ntitle: "Terraform modules"\nsidebar:\n  label: Overview\n  order: 0\n---\n\n' +
			'Hardened modules from [glitch-modules](https://github.com/Vlad-Krastev/glitch-modules), consumed by workload repos pinned to a tag ' +
			'(`source = "git::https://github.com/Vlad-Krastev/glitch-modules.git//modules/<name>?ref=vX.Y.Z"`).\n\n' +
			names.map((n) => `- [${n}](/landing-zone/modules/${n}/)`).join('\n') +
			'\n',
	);
	console.log(`content: ${names.length} module pages generated`);
}
