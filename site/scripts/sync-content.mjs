// Copies the wiki pages from the private glitch-ops-content repo into src/content/docs.
// This repo is public, so it holds no pages itself: CI checks the content repo out and sets
// CONTENT_DIR; locally the content repo is expected next to glitch-ops. Without content, a
// placeholder page is used so the site still builds.
//
// Some Landing Zone pages are generated from the public repos so they are written once, next to
// the code (REPOS_DIR holds glitch-lz and glitch-modules; default: the folder containing
// glitch-ops, i.e. sibling checkouts):
//   landing-zone/modules/<name>       ← glitch-modules/modules/<name>/README.md
//   landing-zone/decisions/<repo>     ← "## Decisions & Notes" of each repo's project.md
//   landing-zone/lessons-learned/<repo> ← each repo's errors.md
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(siteDir, 'src/content/docs');
const source = resolve(process.env.CONTENT_DIR ?? resolve(siteDir, '../../glitch-ops-content/docs'));
const reposDir = resolve(process.env.REPOS_DIR ?? resolve(siteDir, '../..'));
const repos = {
	'glitch-lz': join(reposDir, 'glitch-lz'),
	'glitch-ops': resolve(siteDir, '..'), // this repo
	'glitch-modules': join(reposDir, 'glitch-modules'),
};
const GITHUB = 'https://github.com/Vlad-Krastev';

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

const lz = join(target, 'landing-zone');
if (!existsSync(lz)) process.exit(0);

const page = (title, order, body, label) =>
	`---\ntitle: ${JSON.stringify(title)}\nsidebar:\n${label ? `  label: ${label}\n` : ''}  order: ${order}\n---\n\n${body.trim()}\n`;
const generatedFrom = (repo, path) =>
	`> Generated from [\`${repo}/${path}\`](${GITHUB}/${repo}/blob/main/${path}) — edit it there.\n\n`;

// --- Module pages -----------------------------------------------------------------------------
const modulesDir = join(repos['glitch-modules'], 'modules');
if (existsSync(modulesDir)) {
	const out = join(lz, 'modules');
	mkdirSync(out, { recursive: true });
	const names = readdirSync(modulesDir, { withFileTypes: true })
		.filter((e) => e.isDirectory() && existsSync(join(modulesDir, e.name, 'README.md')))
		.map((e) => e.name)
		.sort();
	for (const [i, name] of names.entries()) {
		// The README's own "# name" heading is dropped: Starlight renders the title.
		const readme = readFileSync(join(modulesDir, name, 'README.md'), 'utf8').replace(/^#\s+.*\n+/, '');
		writeFileSync(join(out, `${name}.md`), page(name, i + 1, generatedFrom('glitch-modules', `modules/${name}/README.md`) + readme));
	}
	const list = names.map((n) => `- [${n}](/landing-zone/modules/${n}/)`).join('\n');
	writeFileSync(
		join(out, 'index.md'),
		page(
			'Terraform modules',
			0,
			`Hardened modules from [glitch-modules](${GITHUB}/glitch-modules), consumed by workload repos pinned to a tag ` +
				'(`source = "git::https://github.com/Vlad-Krastev/glitch-modules.git//modules/<name>?ref=vX.Y.Z"`).\n\n' +
				list,
			'Overview',
		),
	);
	console.log(`content: ${names.length} module pages generated`);
}

// --- Decisions (ADRs) and lessons learned -----------------------------------------------------
// The section from "## Decisions & Notes" to the next "## " heading (or the end of the file).
function decisions(markdown) {
	const start = markdown.search(/^## Decisions & Notes\s*$/m);
	if (start < 0) return undefined;
	const rest = markdown.slice(start).replace(/^## .*\n/, '');
	const end = rest.search(/^## /m);
	return end < 0 ? rest : rest.slice(0, end);
}

let order = 2; // design-phase.md (ClickUp import) is order 1
let decisionCount = 0;
let lessonCount = 0;
for (const [repo, dir] of Object.entries(repos)) {
	const projectFile = join(dir, 'project.md');
	const section = existsSync(projectFile) ? decisions(readFileSync(projectFile, 'utf8')) : undefined;
	if (section) {
		mkdirSync(join(lz, 'decisions'), { recursive: true });
		writeFileSync(join(lz, 'decisions', `${repo}.md`), page(repo, order, generatedFrom(repo, 'project.md') + section));
		decisionCount++;
	}
	const errorsFile = join(dir, 'errors.md');
	if (existsSync(errorsFile)) {
		mkdirSync(join(lz, 'lessons-learned'), { recursive: true });
		const body = readFileSync(errorsFile, 'utf8').replace(/^#\s+.*\n+/, '');
		writeFileSync(join(lz, 'lessons-learned', `${repo}.md`), page(repo, order, generatedFrom(repo, 'errors.md') + body));
		lessonCount++;
	}
	order++;
}
if (existsSync(join(lz, 'decisions'))) {
	writeFileSync(
		join(lz, 'decisions', 'index.md'),
		page(
			'Decision Log',
			0,
			'Architecture decisions (ADRs): decision, reason, rejected alternatives. The design phase (ADR 001–024) ' +
				'comes from the original design doc; everything later lives in the repo it belongs to and is generated from there.',
			'Overview',
		),
	);
}
if (lessonCount) {
	writeFileSync(
		join(lz, 'lessons-learned', 'index.md'),
		page(
			'Lessons learned',
			0,
			"Every failed attempt and its fix (`ERR-NNN`), generated from each repo's `errors.md`. Check here before debugging something that looks familiar.",
			'Overview',
		),
	);
}
console.log(`content: ${decisionCount} decision pages, ${lessonCount} lessons-learned pages generated`);
