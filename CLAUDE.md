# CLAUDE.md — glitch-ops

GlitchOps wiki: public repo for the **site, login server, infra and CI**. The pages live in the
private `glitch-ops-content` repo (sibling checkout `~/glitch-ops-content`). Design: `project.md`
(ADRs), past failures: `errors.md` — check before debugging, log failed attempts immediately.

## Layout

| Path | What | Commands |
|---|---|---|
| `site/` | Astro Starlight; sidebar built from content folders (`astro.config.mjs`) | `pnpm dev`, `pnpm build` (both sync content first) |
| `site/scripts/sync-content.mjs` | copies pages from the content repo; generates module / decision / lessons-learned pages from the public repos | `pnpm content:sync` |
| `server/` | Hono login gate (Firebase session cookie + allowlist); Node 24 runs the TS directly | `pnpm test`, `pnpm typecheck` |
| `infra/` | Terraform per env (`dev.tfvars` / `prod.tfvars`), modules from glitch-modules by tag | plan via CI; local: init with `-backend-config` (see `infra/README.md`) |
| `.github/workflows/` | `ci.yml` (PR checks + dev plan; deploy on main / manual run) + reusable `deploy-env.yml` | — |

## Rules

- **Public repo:** no secrets, real IDs or emails; page names/titles must never reach CI logs (silent
  site build, plan prints addresses only, no artifact uploads).
- No pages in this repo — content goes to `glitch-ops-content` (use the `wiki-publish` skill).
- Generated pages (`landing-zone/modules|decisions|lessons-learned`) are edited at their source repo.
- pnpm 11 enforces a 1-day minimum release age; pin older versions rather than relaxing it. Build
  scripts are opted in/out in each `pnpm-workspace.yaml`; security fixes for transitive deps via
  `overrides` there.
- Deploy flow: merge → dev automatically → prod waits for the `prod` environment approval (same
  commits). A newer run replaces a waiting prod approval. Prod first-time checklist: `task.md`.
- Dependabot PRs skip the dev plan (no secrets on Dependabot runs).
- Login server changes: run `/security-review` before merging.
