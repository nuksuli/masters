terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "3.0.0"
    }
  }

  required_version = ">= 0.14"
}

provider "azurerm" {
  features {}
}

variable "project" {
  default = "<project-name>" // Your project or application name
}

variable "location" {
  default = "East US" // Example Azure region
}

// Azure Resource Group
resource "azurerm_resource_group" "rg" {
  name     = "${var.project}-resources"
  location = var.location
}

// MySQL Server
resource "azurerm_mysql_server" "mysql_server" {
  name                = "${var.project}-mysql-server"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  administrator_login          = "mysqladminun"
  administrator_login_password = "<admin-password>"

  sku_name   = "<tier>"
  version    = "8.0"
  storage_mb = 5120

  auto_grow_enabled                 = true
  backup_retention_days             = 7
  geo_redundant_backup_enabled      = false
  public_network_access_enabled     = false
  ssl_enforcement_enabled           = true
  ssl_minimal_tls_version_enforced  = "TLS1_2"
  infrastructure_encryption_enabled = false

  deletion_protection = true
}

// MySQL Database
resource "azurerm_mysql_database" "mysql_db" {
  name                = "my-database"
  resource_group_name = azurerm_resource_group.rg.name
  server_name         = azurerm_mysql_server.mysql_server.name
  charset             = "utf8"
  collation           = "utf8_unicode_ci"
}
