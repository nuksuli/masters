terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.0.0"
    }
  }
}

// Provider configuration for AWS
provider "aws" {
  region = "<region>"
}

// RDS MySQL database instance
resource "aws_db_instance" "instance" {
  identifier        = "my-database-instance"
  allocated_storage = <allocated_storage>
  storage_type      = "gp2"
  engine            = "mysql"
  engine_version    = "8.0.23"
  instance_class    = "<instance-class>"
  name              = "mydatabase"
  username          = "<username>"
  password          = "<password>"
  skip_final_snapshot = true
  deletion_protection = false
}