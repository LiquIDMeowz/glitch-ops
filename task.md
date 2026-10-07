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
| Prod: add Firebase to glitch-ops-prod (one-time, operator credentials) | pending | Before the first prod deploy. Deployer can't: AddFirebase enables ~14 APIs and the deployer has no serviceusage admin **by design** — don't widen it. Then `terraform import google_firebase_project.this projects/glitch-ops-prod` into `ops/prod` state (infra/README). Firebase also creates the undeletable default site `glitch-ops-prod` — ignore it |
| Prod: approve the waiting prod deploy | pending | After the Firebase step; creates Auth config, `glitch-ops-prod-wiki` site, AR, Cloud Run |
| Prod: Google sign-in in Firebase console + OAuth client redirect URI/origin for wiki.glitch-cloud.com (ERR-003) + DNS for `wiki` at SuperHosting | pending | Same TXT + CNAME pattern as dev.hub / dev.wiki (not Firebase's literal records); CNAME → glitch-ops-prod-wiki.web.app |
| Hardening: logout via POST, Content-Security-Policy, pin node:24-slim by digest | pending | From the pre-deploy review 2026-10-01; none blocking |
| glitch-lz 3-projects: Firebase for `ops` | done | glitch-lz #20 (apply needs lz-apply approval). APIs firebase, firebasehosting, identitytoolkit; deployer roles firebasehosting.admin + identityplatform.admin; drop iap API/role; custom role with only `firebaseauth.users.createSession` + runtime SA `wiki@` granted it (deployer can't grant IAM — no projectIamAdmin by design). Then lz-apply approval |
| glitch-modules cloud-run-service: optional existing `service_account_email` | done | glitch-modules #5 | So the factory-created runtime SA can be used; before tagging v0.1.0 |
| Infra: Artifact Registry, Cloud Run (max_instances, Firebase-proxied), log exclusion | done | glitch-modules @ 074f621; tag v0.1.0 after first dev deploy |
| CI: build (content via deploy key, quiet logs), deploy dev, promote prod | done | `ci.yml` + reusable `deploy-env.yml`; needs env secrets CONTENT_DEPLOY_KEY + ALLOWED_EMAILS (dev, prod) |

## Handoff

- 2026-10-07: wiki live on **dev** (https://dev.wiki.glitch-cloud.com): ClickUp import (102 pages), Workloads, generated ADRs / lessons learned / modules, Mermaid. Dependabot alerts fixed; Dependabot PRs skip the plan job (no secrets).
- Next: **prod** — follow the Prod rows above in order (Firebase by operator → approve deploy → sign-in + OAuth client + DNS). Optional: hardening row, more CMEK pages.
