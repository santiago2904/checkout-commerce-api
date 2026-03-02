# ================================
# VPC Outputs
# ================================
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

# ================================
# Security Group Outputs
# ================================
output "ecs_tasks_security_group_id" {
  description = "ID of the ECS tasks security group"
  value       = aws_security_group.ecs_tasks.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

# ================================
# RDS Outputs
# ================================
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_address" {
  description = "RDS instance address (hostname)"
  value       = aws_db_instance.postgres.address
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.postgres.port
}

output "rds_database_name" {
  description = "Name of the PostgreSQL database"
  value       = aws_db_instance.postgres.db_name
}

output "rds_username" {
  description = "Master username for the database"
  value       = aws_db_instance.postgres.username
  sensitive   = true
}

output "rds_connection_string" {
  description = "PostgreSQL connection string (without password)"
  value       = "postgresql://${aws_db_instance.postgres.username}:***@${aws_db_instance.postgres.address}:${aws_db_instance.postgres.port}/${aws_db_instance.postgres.db_name}"
  sensitive   = true
}

# ================================
# ECR Outputs
# ================================
output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.app.repository_url
}

output "ecr_repository_name" {
  description = "Name of the ECR repository"
  value       = aws_ecr_repository.app.name
}

output "ecr_repository_arn" {
  description = "ARN of the ECR repository"
  value       = aws_ecr_repository.app.arn
}

# ================================
# Secrets Manager Outputs
# ================================
output "db_credentials_secret_arn" {
  description = "ARN of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "db_credentials_secret_name" {
  description = "Name of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.name
}

# ================================
# General Information
# ================================
output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}
