# ================================
# Terraform Configuration
# ================================
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Uncomment this block to use S3 backend for state management
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "checkout-commerce/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }
}

# ================================
# Provider Configuration
# ================================
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

# ================================
# VPC and Networking
# ================================
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-${var.environment}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-igw"
  }
}

# Public Subnets (for future ALB or NAT Gateway)
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-${var.environment}-public-subnet-${count.index + 1}"
  }
}

# Private Subnets (for RDS and ECS tasks)
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.project_name}-${var.environment}-private-subnet-${count.index + 1}"
  }
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-public-rt"
  }
}

# Associate Public Subnets with Route Table
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ================================
# Security Groups
# ================================

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-${var.environment}-rds-sg"
  description = "Security group for RDS PostgreSQL instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "PostgreSQL from ECS"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-sg"
  }
}

# Security Group for ECS Tasks
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.project_name}-${var.environment}-ecs-tasks-sg"
  description = "Security group for ECS Fargate tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from anywhere (will be restricted to ALB in Phase 2)"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-ecs-tasks-sg"
  }
}

# ================================
# RDS PostgreSQL Instance
# ================================

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-${var.environment}-db-subnet-group"
  }
}

# Random password for RDS (if not provided)
resource "random_password" "db_password" {
  count   = var.db_password == "" ? 1 : 0
  length  = 32
  special = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "postgres" {
  identifier     = "${var.project_name}-${var.environment}-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = 100 # Enable storage autoscaling
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password != "" ? var.db_password : random_password.db_password[0].result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = var.db_publicly_accessible

  multi_az               = var.db_multi_az
  backup_retention_period = var.db_backup_retention_days
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  skip_final_snapshot       = true # Set to false in production
  final_snapshot_identifier = "${var.project_name}-${var.environment}-db-final-snapshot"

  # Free tier optimization
  enabled_cloudwatch_logs_exports = [] # Disable CloudWatch logs to save costs
  performance_insights_enabled    = false

  tags = {
    Name = "${var.project_name}-${var.environment}-postgres"
  }
}

# ================================
# Amazon ECR (Elastic Container Registry)
# ================================
resource "aws_ecr_repository" "app" {
  name                 = "${var.project_name}-${var.environment}"
  image_tag_mutability = var.ecr_image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.ecr_scan_on_push
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-ecr"
  }
}

# ECR Lifecycle Policy (to manage old images)
resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.ecr_lifecycle_max_images} images"
        selection = {
          tagStatus     = "any"
          countType     = "imageCountMoreThan"
          countNumber   = var.ecr_lifecycle_max_images
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# ================================
# Secrets Manager (for database credentials)
# ================================
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.project_name}/${var.environment}/db-credentials"
  description             = "Database credentials for ${var.project_name}"
  recovery_window_in_days = 7

  tags = {
    Name = "${var.project_name}-${var.environment}-db-secret"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password != "" ? var.db_password : random_password.db_password[0].result
    host     = aws_db_instance.postgres.address
    port     = aws_db_instance.postgres.port
    dbname   = var.db_name
    engine   = "postgres"
  })
}
