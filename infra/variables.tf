variable "project_id" {
  description = "glitch-ops-dev or glitch-ops-prod (GitHub environment variable GCP_PROJECT)."
  type        = string
}

variable "env" {
  description = "dev or prod."
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.env)
    error_message = "env must be dev or prod."
  }
}

variable "region" {
  description = "Region for Cloud Run and Artifact Registry."
  type        = string
  default     = "europe-west3"
}

variable "domain" {
  description = "Custom domain of the wiki, e.g. dev.wiki.glitch-cloud.com (DNS at SuperHosting)."
  type        = string
}

variable "image" {
  description = "Wiki image by digest (set by CI). The default is Google's sample image, so the first apply can run before any image was built."
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "allowed_emails" {
  description = "Comma-separated Google accounts allowed to read the wiki (GitHub environment secret)."
  type        = string
  sensitive   = true
}
