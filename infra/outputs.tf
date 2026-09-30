output "image_repository" {
  description = "Where CI pushes the wiki image."
  value       = module.images.url
}

output "server_url" {
  description = "Default Cloud Run URL (reachable, but only useful through the custom domain)."
  value       = module.server.uri
}

output "hosting_url" {
  description = "Firebase Hosting default URL."
  value       = "https://${google_firebase_hosting_site.wiki.site_id}.web.app"
}

output "dns_records" {
  description = "Records to create at SuperHosting for the custom domain."
  value       = google_firebase_hosting_custom_domain.wiki.required_dns_updates
}
