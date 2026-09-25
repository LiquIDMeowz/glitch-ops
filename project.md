# glitch-ops

**GlitchOps** — the Glitch documentation / ops knowledge base: GCP reference docs (migrated from
ClickUp), runbooks and landing-zone notes, published as a docs-as-code static site behind IAP.
No task boards — Git is the source of truth for the docs.

## Environments

| Env | Project | Deployed by | Trigger |
|---|---|---|---|
| dev | `glitch-ops-dev` | `deployer@glitch-ops-dev` via WIF, GitHub environment `dev` | merge to `main` (PRs plan dev) |
| prod | `glitch-ops-prod` | `deployer@glitch-ops-prod` via WIF, GitHub environment `prod` (required reviewer, `main` only) | promotion of the same commit / image |

Projects, deployers, WIF bindings, state access and budgets come from the `glitch-lz` project
factory (`3-projects`). State: `glitch-tfstate-{dev,prod}` prefix `ops/<env>`.

## Constraints from the landing zone

- CMEK required (Autokey) for Artifact Registry, Cloud Run, Storage, etc.
- Cloud Run: hard `max_instances`, IAP in front (auth before the container), request-log exclusion.
- Build in GitHub Actions; `gcloud run deploy --source` doesn't work (it creates non-CMEK resources).
- ≤ $10/month budget per project; dev is killed by the budget kill switch at 100 %.

## Decisions & Notes

- Branching: trunk-based on `main` (glitch-lz ADR 006); public repo (ADR 025) — no secrets or real IDs in Git.
- Static site generator: TBD (decided when the site is built).
