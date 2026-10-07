// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';

// The sidebar mirrors the folders of the (private) content, like ClickUp docs: a folder is a
// group, a Markdown file a page, subfolders nested groups. A folder's index page names its group
// (its title, e.g. "Network & Security") and shows as "Overview"; pages are ordered by
// `sidebar.order`. Nothing about the content is hard-coded in this public repo.
const docsDir = fileURLToPath(new URL('./src/content/docs/', import.meta.url));
const PAGE = /\.mdx?$/;

// Folder name → fallback label when a folder has no index page ("cmek" → "CMEK").
const ACRONYMS = new Set(['cmek', 'gcp', 'iam', 'vpc', 'gcs', 'gke', 'kms', 'dns', 'sql', 'ci', 'cd', 'ai', 'ml']);
const label = (name) =>
	name
		.split('-')
		.map((word) => (ACRONYMS.has(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
		.join(' ');

// Minimal frontmatter read: title and sidebar.order are all the sidebar needs.
function frontmatter(file) {
	const head = readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
	const title = head.match(/^title:\s*(.+)$/m)?.[1].trim().replace(/^["']|["']$/g, '');
	const order = Number(head.match(/^\s+order:\s*(-?\d+)\s*$/m)?.[1] ?? Infinity);
	return { title, order };
}

function group(dir, slugPrefix, depth) {
	const entries = readdirSync(dir, { withFileTypes: true });
	const indexFile = entries.find((e) => e.isFile() && /^index\.mdx?$/.test(e.name));
	const pages = entries
		.filter((e) => e.isFile() && PAGE.test(e.name))
		.map((e) => {
			const name = e.name.replace(PAGE, '');
			return { slug: name === 'index' ? slugPrefix : `${slugPrefix}/${name}`, ...frontmatter(join(dir, e.name)) };
		})
		.sort((a, b) => a.order - b.order || (a.title ?? '').localeCompare(b.title ?? ''))
		.map(({ slug }) => slug);
	const subgroups = entries
		.filter((e) => e.isDirectory())
		.map((e) => group(join(dir, e.name), `${slugPrefix}/${e.name}`, depth + 1))
		.sort((a, b) => a.label.localeCompare(b.label));
	const name = slugPrefix.split('/').pop() ?? slugPrefix;
	return {
		label: (depth > 0 && indexFile && frontmatter(join(dir, indexFile.name)).title) || label(name),
		collapsed: true,
		items: [...pages, ...subgroups],
	};
}

// Top-level groups keep their folder label ("Landing Zone", "Workloads", "GCP", "Kubernetes", "Terraform", "Platforms", "Reference", "Runbooks").
const ORDER = ['landing-zone', 'workloads', 'gcp', 'kubernetes', 'terraform', 'platforms', 'reference', 'runbooks'];
const sidebar = readdirSync(docsDir, { withFileTypes: true })
	.filter((e) => e.isDirectory())
	.sort((a, b) => {
		const rank = (n) => (ORDER.includes(n) ? ORDER.indexOf(n) : ORDER.length);
		return rank(a.name) - rank(b.name) || a.name.localeCompare(b.name);
	})
	.map((e) => group(join(docsDir, e.name), e.name, 0));

export default defineConfig({
	integrations: [
		// ```mermaid code blocks render as diagrams (client-side); must come before Starlight.
		mermaid({ autoTheme: true }),
		starlight({
			title: 'GlitchOps',
			description: 'GlitchLZ design, GCP reference, Terraform and runbooks.',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Vlad-Krastev/glitch-ops' }],
			// Pages live in the private content repo; only signed-in wiki users see this link.
			editLink: { baseUrl: 'https://github.com/Vlad-Krastev/glitch-ops-content/edit/main/docs/' },
			sidebar,
		}),
	],
});
