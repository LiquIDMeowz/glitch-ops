locals {
  labels  = { app = "ops", env = var.env, owner = "glitch", managed_by = "terraform" }
  site_id = "${var.project_id}-wiki"
  # Runtime account from the glitch-lz project factory (runtime_accounts): it holds the one
  # permission the server needs (firebaseauth.users.createSession), which deployers can't grant.
  runtime_sa = "wiki-server@${var.project_id}.iam.gserviceaccount.com"
}

# --- Firebase: project, Auth (Identity Platform), Hosting ---------------------------------------

resource "google_firebase_project" "this" {
  provider = google-beta
  project  = var.project_id
}

# Only Google sign-in (enabled once in the Firebase console, see README); email/password and
# anonymous accounts stay off. Who may read the wiki is decided by the server's allowlist.
resource "google_identity_platform_config" "this" {
  provider = google-beta
  project  = var.project_id

  authorized_domains = [
    var.domain,
    "${var.project_id}.firebaseapp.com",
    "${local.site_id}.web.app",
  ]

  sign_in {
    allow_duplicate_emails = false

    email {
      enabled = false
    }
    anonymous {
      enabled = false
    }
  }

  depends_on = [google_firebase_project.this]
}

resource "google_firebase_hosting_site" "wiki" {
  provider = google-beta
  project  = var.project_id
  site_id  = local.site_id

  depends_on = [google_firebase_project.this]
}

resource "google_firebase_hosting_custom_domain" "wiki" {
  provider      = google-beta
  project       = var.project_id
  site_id       = google_firebase_hosting_site.wiki.site_id
  custom_domain = var.domain

  # DNS lives at SuperHosting and is added by hand from the dns_records output.
  wait_dns_verification = false
}

# Hosting serves nothing itself: every request goes to the login server on Cloud Run.
resource "google_firebase_hosting_version" "wiki" {
  provider = google-beta
  site_id  = google_firebase_hosting_site.wiki.site_id

  config {
    rewrites {
      glob = "**"
      run {
        service_id = module.server.name
        region     = var.region
      }
    }
  }
}

resource "google_firebase_hosting_release" "wiki" {
  provider     = google-beta
  site_id      = google_firebase_hosting_site.wiki.site_id
  version_name = google_firebase_hosting_version.wiki.name
  message      = "Rewrite all paths to ${module.server.name}"
}

# --- Container image registry and the login server ----------------------------------------------

module "images" {
  source = "git::https://github.com/Vlad-Krastev/glitch-modules.git//modules/artifact-repo?ref=074f621f9c75751cfd41cdab74e6b0012ce47b7b"

  project_id    = var.project_id
  repository_id = "wiki"
  location      = var.region
  description   = "GlitchOps wiki images (site + login server)"
  labels        = local.labels
}

module "server" {
  source = "git::https://github.com/Vlad-Krastev/glitch-modules.git//modules/cloud-run-service?ref=074f621f9c75751cfd41cdab74e6b0012ce47b7b"

  project_id            = var.project_id
  name                  = "wiki-server"
  location              = var.region
  image                 = var.image
  service_account_email = local.runtime_sa
  max_instances         = 1
  access                = "firebase" # the server checks the Firebase session + allowlist itself
  memory                = "256Mi"

  env = {
    GOOGLE_CLOUD_PROJECT = var.project_id
    PUBLIC_ORIGIN        = "https://${var.domain}"
    FIREBASE_AUTH_DOMAIN = var.domain # Hosting serves /__/auth/* on the custom domain
    FIREBASE_API_KEY     = google_identity_platform_config.this.client[0].api_key
    ALLOWED_EMAILS       = var.allowed_emails
    SITE_DIR             = "/app/site"
  }

  deletion_protection = var.env == "prod"
  labels              = local.labels
}
