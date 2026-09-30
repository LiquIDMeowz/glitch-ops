# Tasks

| Task | Status | Notes |
|---|---|---|
| Repo guardrails | done | gitignore, gitleaks + fmt hook, rulesets, security settings |
| Projects via glitch-lz 3-projects | done | glitch-ops-dev / -prod; GitHub envs dev / prod + variables set |
| Choose static site generator + site skeleton | done | Astro Starlight in `site/`; content from private `glitch-ops-content` |
| Export ClickUp GCP docs to Markdown | pending | Via ClickUp API v3 (pages with content) → `glitch-ops-content/docs/` |
| Login server (Firebase `__session` cookie + email allowlist) | done | `server/` (Hono + firebase-admin, Node 24 runs TS directly), 17 vitest tests; not deployed yet |
| Firebase: project, Hosting sites, Auth config, custom domains (Terraform) | pending | Firebase + Hosting site created in dev by a 2026-09-30 test (scratch state) — import into `infra/` |
| Enable Google sign-in in Firebase console (dev, prod) | pending | One-time manual step per project, after Auth is enabled by Terraform |
| glitch-lz 3-projects: add Firebase APIs to `ops` | pending | firebase, firebasehosting, identitytoolkit |
| Infra: Artifact Registry, Cloud Run (max_instances, Firebase-proxied), log exclusion | pending | Via glitch-modules |
| CI: build (content via deploy key, quiet logs), deploy dev, promote prod | pending | |
