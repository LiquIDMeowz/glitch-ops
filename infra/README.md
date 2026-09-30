# infra

Terraform for one environment of the GlitchOps wiki (run once per env, state per env):

- **Firebase**: project, Hosting site `<project>-wiki` with the custom domain, a release that
  rewrites every path to Cloud Run, and the Auth (Identity Platform) config — Google sign-in only.
- **Artifact Registry** repo `wiki` and the **Cloud Run** login server `wiki-server`
  (glitch-modules), running as the factory-created `wiki-server@` account.

| Env | Project | Domain |
|---|---|---|
| dev | `glitch-ops-dev` | `dev.wiki.glitch-cloud.com` |
| prod | `glitch-ops-prod` | `wiki.glitch-cloud.com` |

CI runs it with the GitHub environment's `GCP_PROJECT`, `STATE_BUCKET`, `STATE_PREFIX` and the
`ALLOWED_EMAILS` secret; `image` is the digest CI just pushed.

## Prerequisites (glitch-lz 3-projects)

`ops` APIs (firebase, firebasehosting, identitytoolkit, run, artifactregistry), deployer roles and
the `wiki-server` runtime account with its `firebaseauth.users.createSession` role.

## One-time manual steps per environment

1. **Google sign-in** — Firebase console → Authentication → Sign-in method → Google → Enable
   (creates the OAuth client; can't be done by API). After the first apply.
2. **DNS** — add the records from `terraform output dns_records` at SuperHosting; Firebase issues
   the certificate once they resolve (can take a few hours).
3. **Import in dev** — Firebase and the Hosting site were created by a test before this code
   existed; import them once instead of recreating:

   ```bash
   terraform init -backend-config=bucket=glitch-tfstate-dev -backend-config=prefix=ops/dev
   terraform import -var-file=dev.tfvars google_firebase_project.this projects/glitch-ops-dev
   terraform import -var-file=dev.tfvars google_firebase_hosting_site.wiki projects/glitch-ops-dev/sites/glitch-ops-dev-wiki
   ```
