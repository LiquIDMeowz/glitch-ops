# GlitchOps site

[Astro Starlight](https://starlight.astro.build) site for the GlitchOps wiki. This repo is public
and holds **no pages**: they live in the private `glitch-ops-content` repo and are copied into
`src/content/docs/` (git-ignored) by `scripts/sync-content.mjs` before every dev/build run.

| Command | What it does |
|---|---|
| `pnpm install` | Install dependencies (`esbuild` build script is allowed in `pnpm-workspace.yaml`) |
| `pnpm dev` | Sync content, start the dev server on http://localhost:4321 |
| `pnpm build` | Sync content, build the static site into `dist/` |
| `pnpm content:sync` | Only sync content (`CONTENT_DIR` overrides `../../glitch-ops-content/docs`) |

Landing Zone module, decision and lessons-learned pages are generated from the public repos (module READMEs, `project.md`, `errors.md`)
(`REPOS_DIR`, default: sibling checkouts). Without the content repo the build uses
`placeholder/index.md`. Sidebar groups are generated from
the content's top-level folders (`astro.config.mjs`), so new groups need no change here.
