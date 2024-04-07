// Terraform configuration
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "4.51.0"
    }
  }
}

// Provider configuration for google
provider "google" {
  credentials = file("credentials.json")
  project     = "<project>"
  region      = "<region>"
}

// Database
resource "google_sql_database" "database" {
  name     = "my-database"
  instance = google_sql_database_instance.instance.name
}

// Database instance
resource "google_sql_database_instance" "instance" {
  name             = "my-database-instance"
  region           = "<region>"
  database_version = "MYSQL_8_0"
  settings {
    tier = "<tier>"
  }

  // This setup is only for testing
  deletion_protection = "false"
}
