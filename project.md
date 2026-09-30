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
- ADR: Static site generator is **Astro Starlight** (site in `site/`) | Reason: Node/pnpm like the
  other web projects, plain Markdown pages, sidebar groups generated from folders (mirrors the
  ClickUp doc folders), built-in client-side search (Pagefind), static output | Tradeoffs: rejected
  MkDocs Material (Python stack, unlike the other web projects), Docusaurus
  (heavier React stack).
- ADR: Content lives in a separate **private** repo `glitch-ops-content`; this repo stays public |
  Reason: the notes must not be public, while this repo keeps the free-plan guardrails of a public
  repo (enforced rulesets, `prod` environment reviewer, push protection — glitch-lz ADR 025) and
  shows how an app is built and deployed on the LZ. CI checks content out with a read-only deploy
  key (environment secret) and builds it into the image; `site/src/content/docs/` is git-ignored,
  the sync script and CI never print page paths (public Actions logs), no build artifacts are
  uploaded | Tradeoffs: rejected making this repo private (loses prod approval gate and rulesets
  on the free plan, GitHub Pro costs ~$4/month) and keeping content public.
- ADR: Served as **Firebase Hosting → Cloud Run** with **Firebase Auth** login, custom domains
  `dev.wiki.glitch-cloud.com` / `wiki.glitch-cloud.com` (DNS at SuperHosting) | Reason: custom
  domain + login + ~$0 can't all be had with IAP in europe-west3 — Cloud Run domain mapping isn't
  available there (and is Preview), and IAP doesn't work behind a Firebase Hosting proxy. A small
  Node server on Cloud Run checks the Firebase `__session` cookie (the only cookie Hosting
  forwards) and an email allowlist before serving any page; responses are `Cache-Control: private`
  so the Hosting CDN never caches a protected page. Google sign-in via the Firebase Auth Google
  provider (enabled once in the Firebase console per project — its OAuth client can't be created by
  API) | Tradeoffs: rejected IAP on the run.app URL (no custom domain), external load balancer +
  IAP (~$18+/month, LZ rule "no load balancers"), static Firebase Hosting without login (content
  would be public, and CDN egress past the free tier is billed). Tested 2026-09-30: Firebase +
  Hosting site can be added to an LZ project despite the CMEK policies; Firebase's service agent
  enables ~14 dependent APIs (incl. identitytoolkit, securetoken).
