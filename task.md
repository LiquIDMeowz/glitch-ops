# Tasks

| Task | Status | Notes |
|---|---|---|
| Repo guardrails | done | gitignore, gitleaks + fmt hook, rulesets, security settings |
| Projects via glitch-lz 3-projects | done | glitch-ops-dev / -prod; GitHub envs dev / prod + variables set |
| Choose static site generator + site skeleton | done | Astro Starlight in `site/`; content from private `glitch-ops-content` |
| Export ClickUp GCP docs to Markdown | pending | Via ClickUp API v3 (pages with content) → `glitch-ops-content/docs/` |
| Login server (Firebase `__session` cookie + email allowlist) | done | `server/` (Hono + firebase-admin, Node 24 runs TS directly), 17 vitest tests; not deployed yet |
| Firebase: project, Hosting sites, Auth config, custom domains (Terraform) | done | `infra/` (#5); dev Firebase project + site still to import (infra/README) | Firebase + Hosting site created in dev by a 2026-09-30 test (scratch state) — import into `infra/` |
| Enable Google sign-in in Firebase console (dev, prod) | pending | One-time manual step per project, after Auth is enabled by Terraform |
| glitch-lz 3-projects: Firebase for `ops` | done | glitch-lz #20 (apply needs lz-apply approval). APIs firebase, firebasehosting, identitytoolkit; deployer roles firebasehosting.admin + identityplatform.admin; drop iap API/role; custom role with only `firebaseauth.users.createSession` + runtime SA `wiki@` granted it (deployer can't grant IAM — no projectIamAdmin by design). Then lz-apply approval |
| glitch-modules cloud-run-service: optional existing `service_account_email` | done | glitch-modules #5 | So the factory-created runtime SA can be used; before tagging v0.1.0 |
| Infra: Artifact Registry, Cloud Run (max_instances, Firebase-proxied), log exclusion | done | glitch-modules @ 074f621; tag v0.1.0 after first dev deploy |
| CI: build (content via deploy key, quiet logs), deploy dev, promote prod | done | `ci.yml` + reusable `deploy-env.yml`; needs env secrets CONTENT_DEPLOY_KEY + ALLOWED_EMAILS (dev, prod) |

## Handoff

- 2026-09-30: skeleton, private content repo, login server (#3), modules (glitch-modules #4, CI + required `ci-ok`) done. Firebase + Hosting site `glitch-ops-dev-wiki` exist in dev from a scratch test (local state in a Claude scratchpad — re-import into `infra/`, don't recreate).
- Next: glitch-lz 3-projects Firebase change (task above) → module SA option → `glitch-ops/infra` (Firebase import, Hosting sites, Auth config, custom domains, artifact-repo + cloud-run-service, Dockerfile) → CI with deploy key → /security-review → manual steps (Google sign-in in Firebase console, SuperHosting DNS, deploy key).
