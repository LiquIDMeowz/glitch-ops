# Errors

## ERR-001 — Enabling Firebase APIs failed with user_project_override
- **Date:** 2026-09-30
- **Tried:** scratch Terraform test in `glitch-ops-dev` with one `google-beta` provider
  (`billing_project = glitch-ops-dev`, `user_project_override = true`) for both
  `google_project_service` (firebase, firebasehosting) and `google_firebase_project`.
- **Result:** `Cloud Resource Manager API has not been used in project glitch-ops-dev before or it
  is disabled ... accessNotConfigured` on `google_project_service`: with the override, Service Usage
  calls use glitch-ops-dev as quota project, which didn't have cloudresourcemanager enabled.

### Resolution
Two providers, as in Firebase's Terraform samples: a plain provider (caller's quota project) for
`google_project_service`, and the `user_project_override` provider only for Firebase resources.

## ERR-002 — First dev deploy: Cloud Run rejected 256Mi memory
- **Date:** 2026-10-01 (run 36826932358)
- **Tried:** `infra/main.tf` set `memory = "256Mi"` on the `cloud-run-service` module (gen2).
- **Result:** `Error 400: template.containers.resources.limits.memory: Invalid value specified for memory. Total memory < 512 Mi is not supported with gen2 execution environment.` Site build, AR repo and image push had succeeded.

### Resolution
Removed the override; the module default (512Mi) is the gen2 minimum. Cost is unaffected in
practice (scale to zero, billed per request). Follow-up: validate memory ≥ 512Mi in the module.

## ERR-003 — Sign-in on dev.wiki: Error 400 redirect_uri_mismatch
- **Date:** 2026-10-07
- **Tried:** Google sign-in on https://dev.wiki.glitch-cloud.com after enabling the Google provider in the Firebase console.
- **Result:** `Access blocked: Error 400: redirect_uri_mismatch`. The OAuth client Firebase auto-creates only allows `https://<project>.firebaseapp.com/__/auth/handler`, but the login uses the custom domain as `authDomain`.

### Resolution
Console (APIs & Services → Credentials → "Web client (auto created by Google Service)"): add
JavaScript origin `https://<domain>` and redirect URI `https://<domain>/__/auth/handler`. Needed per
project (prod: wiki.glitch-cloud.com). Also: Google picked the first browser account silently —
login now sets `prompt: 'select_account'`.
