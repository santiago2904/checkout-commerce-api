# ================================
# Project Configuration
# ================================
variable "project_name" {
  description = "Name of the project (used for resource naming)"
  type        = string
  default     = "checkout-commerce"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

# ================================
# Database Configuration
# ================================
variable "db_instance_class" {
  description = "RDS instance class (use db.t3.micro for free tier)"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "checkoutdb"
}

variable "db_username" {
  description = "Master username for the database"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Master password for the database"
  type        = string
  sensitive   = true
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB (20 GB is free tier eligible)"
  type        = number
  default     = 20
}

variable "db_backup_retention_days" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 7
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment (not free tier, set to false)"
  type        = bool
  default     = false
}

variable "db_publicly_accessible" {
  description = "Make database publicly accessible (set to false for security)"
  type        = bool
  default     = false
}

# ================================
# ECR Configuration
# ================================
variable "ecr_image_tag_mutability" {
  description = "Image tag mutability setting for ECR (MUTABLE or IMMUTABLE)"
  type        = string
  default     = "MUTABLE"
}

variable "ecr_scan_on_push" {
  description = "Enable image scanning on push"
  type        = bool
  default     = true
}

variable "ecr_lifecycle_max_images" {
  description = "Maximum number of images to retain in ECR"
  type        = number
  default     = 10
}

# ================================
# Networking Configuration
# ================================
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for subnets"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

# ================================
# Tags
# ================================
variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "checkout-commerce"
    ManagedBy   = "Terraform"
  }
}
