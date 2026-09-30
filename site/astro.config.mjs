// @ts-check
import { readdirSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// Sidebar groups come from the top-level folders of the (private) content, like ClickUp doc
// folders: `automation/` becomes the "Automation" group and every Markdown file in it a page;
// subfolders become nested groups. Nothing about the content is hard-coded in this public repo.
const docsDir = new URL('./src/content/docs/', import.meta.url);
const label = (name) => name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const groups = readdirSync(docsDir, { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map(({ name }) => ({
		label: label(name),
		collapsed: true,
		items: [{ autogenerate: { directory: name, collapsed: true } }],
	}));

export default defineConfig({
	integrations: [
		starlight({
			title: 'GlitchOps',
			description: 'GCP reference docs, runbooks and landing-zone notes.',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Vlad-Krastev/glitch-ops' }],
			// Pages live in the private content repo; only signed-in wiki users see this link.
			editLink: { baseUrl: 'https://github.com/Vlad-Krastev/glitch-ops-content/edit/main/docs/' },
			sidebar: groups,
		}),
	],
});
