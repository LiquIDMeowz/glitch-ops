terraform {
  required_version = ">= 1.9"

  # Partial config: CI passes bucket/prefix from the GitHub environment (STATE_BUCKET /
  # STATE_PREFIX), e.g. glitch-tfstate-dev + ops/dev. The deployer can only use its own prefix.
  backend "gcs" {}

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 7.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Firebase and Identity Platform APIs must be called with this project as the quota project
# (errors.md ERR-001: don't use the override for google_project_service).
provider "google-beta" {
  project               = var.project_id
  region                = var.region
  billing_project       = var.project_id
  user_project_override = true
}
