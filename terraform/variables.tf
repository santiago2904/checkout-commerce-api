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
  description = "Number of days to retain database backups (Free Tier: max 1 day)"
  type        = number
  default     = 1
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
# ECS Configuration
# ================================
variable "ecs_task_cpu" {
  description = "CPU units for ECS task (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "ecs_task_memory" {
  description = "Memory for ECS task in MB"
  type        = number
  default     = 1024
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 1
}

variable "ecs_max_count" {
  description = "Maximum number of ECS tasks for autoscaling"
  type        = number
  default     = 2
}

variable "ecs_min_count" {
  description = "Minimum number of ECS tasks for autoscaling"
  type        = number
  default     = 1
}

variable "app_port" {
  description = "Port on which the application runs"
  type        = number
  default     = 3000
}

variable "health_check_path" {
  description = "Health check path for ALB target group"
  type        = string
  default     = "/api/health"
}

variable "container_image" {
  description = "Docker image to deploy (will be built and pushed to ECR)"
  type        = string
  default     = "latest"
}

# ================================
# Application Load Balancer
# ================================
variable "enable_alb" {
  description = "Enable Application Load Balancer (set to false to use public IP only)"
  type        = bool
  default     = true
}

variable "alb_ssl_certificate_arn" {
  description = "ARN of SSL certificate for HTTPS (leave empty for HTTP only)"
  type        = string
  default     = ""
}

# ================================
# Tags
# ================================
variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project   = "checkout-commerce"
    ManagedBy = "Terraform"
  }
}

# ================================
# Application Environment Variables
# ================================
variable "jwt_secret" {
  description = "JWT secret key for token signing"
  type        = string
  sensitive   = true
}

variable "jwt_expires_in" {
  description = "JWT token expiration time (e.g., 1h, 7d)"
  type        = string
  default     = "1h"
}

variable "wompi_public_key" {
  description = "Wompi public API key"
  type        = string
  sensitive   = true
}

variable "wompi_private_key" {
  description = "Wompi private API key"
  type        = string
  sensitive   = true
}

variable "wompi_api_url" {
  description = "Wompi API URL (sandbox or production)"
  type        = string
  default     = "https://sandbox.wompi.co/v1"
}

variable "wompi_events_secret" {
  description = "Wompi webhook events secret"
  type        = string
  sensitive   = true
}

variable "wompi_integrity_secret" {
  description = "Wompi integrity secret for signature calculation"
  type        = string
  sensitive   = true
}

variable "frontend_url" {
  description = "Frontend application URL for CORS"
  type        = string
  default     = "http://localhost:3001"
}
