terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.0.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "2.7.1"
    }
  }
  required_version = ">= 0.14"
}

provider "aws" {
  region = var.region
}

variable "region" {
  default     = ""
  description = "AWS region"
}

variable "project_id" {
  default     = ""
  description = "Project ID"
}

variable "eks_cluster_name" {
  default     = ""
  description = "EKS Cluster Name"
}

variable "eks_num_nodes" {
  default     = 2
  description = "Number of EKS nodes"
}

# EKS Cluster
resource "aws_eks_cluster" "primary" {
  name     = "${var.project_id}-eks"
  role_arn = aws_iam_role.eks.arn

  vpc_config {
    subnet_ids = aws_subnet.main[*].id
  }
}

# IAM role for EKS
resource "aws_iam_role" "eks" {
  name = "eks-cluster-${var.project_id}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      },
    ]
  })
}

# Node Group
resource "aws_eks_node_group" "primary_nodes" {
  cluster_name    = aws_eks_cluster.primary.name
  node_group_name = "eks-node-group-${var.project_id}"
  node_role_arn   = aws_iam_role.eks_node.arn
  subnet_ids      = aws_subnet.main[*].id

  scaling_config {
    desired_size = var.eks_num_nodes
    max_size     = var.eks_num_nodes + 1
    min_size     = var.eks_num_nodes - 1
  }
}

# IAM role for EKS Nodes
resource "aws_iam_role" "eks_node" {
  name = "eks-node-${var.project_id}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      },
    ]
  })
}

provider "kubernetes" {
  host                   = aws_eks_cluster.primary.endpoint
  cluster_ca_certificate = base64decode(aws_eks_cluster.primary.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.primary.token
}

data "aws_eks_cluster_auth" "primary" {
  name = aws_eks_cluster.primary.name
}

resource "kubernetes_namespace" "terraform-aws" {
  metadata {
    name = "terraform-aws"
  }
}