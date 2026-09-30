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
