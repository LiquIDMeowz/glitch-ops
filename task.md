# Tasks

| Task | Status | Notes |
|---|---|---|
| Repo guardrails | done | gitignore, gitleaks + fmt hook, rulesets, security settings |
| Projects via glitch-lz 3-projects | done | glitch-ops-dev / -prod; GitHub envs dev / prod + variables set |
| Choose static site generator + site skeleton | done | Astro Starlight in `site/`; content from private `glitch-ops-content` |
| Export ClickUp docs to Markdown | done | 2026-10-07: 102 pages from the 9 current docs (LZ Design, Terraform, 7 GCP) via API v3; links rewritten. ClickUp kept as backup; legacy single-page .md docs not imported |
| Generate LZ ADR page from glitch-lz `project.md` | done | 2026-10-07: decisions + lessons learned generated from project.md / errors.md of the public repos |
| Login server (Firebase `__session` cookie + email allowlist) | done | `server/` (Hono + firebase-admin, Node 24 runs TS directly), 17 vitest tests; not deployed yet |
| Firebase: project, Hosting sites, Auth config, custom domains (Terraform) | done | `infra/` (#5); dev Firebase project + site still to import (infra/README) | Firebase + Hosting site created in dev by a 2026-09-30 test (scratch state) — import into `infra/` |
| First dev deploy | done | 2026-10-01 run 36828102412 (after ERR-002); Hosting → Cloud Run → login page verified |
| Enable Google sign-in (dev) + DNS for dev.wiki | done | 2026-10-07; certificate minting. Test sign-in on https://dev.wiki.glitch-cloud.com (sign-in only works on the custom domain) |
| Starlight plugins: links validator + code-block fullscreen | done | 2026-10-08; validator fails the build on broken internal links (CI output stays hidden) |
| Prod: add Firebase to glitch-ops-prod (one-time, operator credentials) | pending | Before the first prod deploy. Deployer can't: AddFirebase enables ~14 APIs and the deployer has no serviceusage admin **by design** — don't widen it. Then `terraform import google_firebase_project.this projects/glitch-ops-prod` into `ops/prod` state (infra/README). Firebase also creates the undeletable default site `glitch-ops-prod` — ignore it |
| Prod: approve the waiting prod deploy | pending | After the Firebase step; creates Auth config, `glitch-ops-prod-wiki` site, AR, Cloud Run |
| Prod: Google sign-in in Firebase console + OAuth client redirect URI/origin for wiki.glitch-cloud.com (ERR-003) + DNS for `wiki` at SuperHosting | pending | Same TXT + CNAME pattern as dev.hub / dev.wiki (not Firebase's literal records); CNAME → glitch-ops-prod-wiki.web.app |
| Hardening: logout via POST, Content-Security-Policy, pin node:24-slim by digest | pending | From the pre-deploy review 2026-10-01; none blocking |
| glitch-lz 3-projects: Firebase for `ops` | done | glitch-lz #20 (apply needs lz-apply approval). APIs firebase, firebasehosting, identitytoolkit; deployer roles firebasehosting.admin + identityplatform.admin; drop iap API/role; custom role with only `firebaseauth.users.createSession` + runtime SA `wiki@` granted it (deployer can't grant IAM — no projectIamAdmin by design). Then lz-apply approval |
| glitch-modules cloud-run-service: optional existing `service_account_email` | done | glitch-modules #5 | So the factory-created runtime SA can be used; before tagging v0.1.0 |
| Infra: Artifact Registry, Cloud Run (max_instances, Firebase-proxied), log exclusion | done | glitch-modules @ 074f621; tag v0.1.0 after first dev deploy |
| CI: build (content via deploy key, quiet logs), deploy dev, promote prod | done | `ci.yml` + reusable `deploy-env.yml`; needs env secrets CONTENT_DEPLOY_KEY + ALLOWED_EMAILS (dev, prod) |

## Handoff

- 2026-10-08: wiki on **dev** has 166 pages — ClickUp import, Workloads, generated ADRs / lessons learned /
  modules, GCP network gaps, new Kubernetes / Platforms / Reference sections (from ~/Companions), 9 runbooks.
  Claude setup: slim global CLAUDE.md + path-scoped rules, guard hook, agents `wiki-writer` / `docs-verifier`,
  skills `init-project` / `lz-new-app` / `deploy-workload` / `wiki-publish` / `merge-pr`, repo CLAUDE.md files.
- Next: **prod** (Prod rows above, runbook `runbooks/promote-to-prod`). Optional: hardening row; a git
  pre-commit hook in the public repos for real IDs (the Claude guard only covers Claude's commits);
  `docs-verifier` sweeps per wiki section; Interconnect 50/100 Gbps note (Google docs disagree).
