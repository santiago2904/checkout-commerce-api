# Terraform Infrastructure - Fase 1

Este directorio contiene la configuración de Infrastructure as Code (IaC) para desplegar el backend de Checkout Commerce en AWS.

## 📋 Requisitos Previos

1. **Terraform instalado** (versión >= 1.0)
   ```bash
   # macOS
   brew install terraform
   
   # Verificar instalación
   terraform version
   ```

2. **AWS CLI configurado** con credenciales válidas
   ```bash
   # macOS
   brew install awscli
   
   # Configurar credenciales
   aws configure
   ```

3. **Credenciales de AWS** con permisos para:
   - VPC, Subnets, Security Groups
   - RDS (PostgreSQL)
   - ECR (Elastic Container Registry)
   - Secrets Manager
   - IAM (para roles de ECS en Fase 2)

## 🚀 Comandos de Terraform (Fase 1)

### 1. Preparación Inicial

```bash
# Navegar al directorio de Terraform
cd terraform

# Copiar el archivo de variables de ejemplo
cp terraform.tfvars.example terraform.tfvars

# Editar terraform.tfvars con tus valores
nano terraform.tfvars  # o usa tu editor preferido
```

**IMPORTANTE:** Cambia el valor de `db_password` por una contraseña segura de al menos 32 caracteres.

### 2. Inicializar Terraform

```bash
# Inicializar el backend y descargar providers
terraform init
```

Este comando:
- Descarga el provider de AWS
- Inicializa el backend local (state file)
- Prepara el directorio de trabajo

### 3. Validar la Configuración

```bash
# Validar sintaxis
terraform validate

# Formatear archivos (opcional)
terraform fmt
```

### 4. Planificar los Cambios

```bash
# Ver qué recursos se crearán
terraform plan

# Guardar el plan en un archivo (opcional)
terraform plan -out=tfplan
```

Revisa cuidadosamente el output. Deberías ver algo como:
- 1 VPC
- 4 Subnets (2 públicas, 2 privadas)
- 2 Security Groups
- 1 Internet Gateway
- 1 Route Table
- 1 RDS Instance (PostgreSQL)
- 1 ECR Repository
- 1 Secrets Manager Secret

### 5. Aplicar la Infraestructura

```bash
# Aplicar los cambios
terraform apply

# O aplicar el plan guardado
terraform apply tfplan
```

Terraform te pedirá confirmación. Escribe `yes` para continuar.

⏱️ **Tiempo estimado:** 10-15 minutos (la creación de RDS es lenta)

### 6. Obtener los Outputs

```bash
# Ver todos los outputs
terraform output

# Ver un output específico
terraform output ecr_repository_url
terraform output rds_endpoint

# Ver outputs sensibles
terraform output -json rds_username
```

Guarda estos valores, especialmente:
- `ecr_repository_url`: Lo necesitarás para el pipeline de CI/CD
- `rds_endpoint`: Endpoint de tu base de datos
- `db_credentials_secret_name`: Para acceder a las credenciales desde ECS

## 🔒 Seguridad

### Archivo terraform.tfvars

**NUNCA** subas el archivo `terraform.tfvars` a Git. Ya está incluido en `.gitignore`.

```bash
# Verificar que está ignorado
cat ../.gitignore | grep terraform.tfvars
```

### Contraseña de la Base de Datos

Las credenciales de la base de datos se almacenan en:
1. **Terraform State** (local o remoto)
2. **AWS Secrets Manager** (recomendado para acceso desde aplicaciones)

Para recuperar la contraseña desde Secrets Manager:

```bash
aws secretsmanager get-secret-value \
  --secret-id $(terraform output -raw db_credentials_secret_name) \
  --query SecretString --output text | jq -r '.password'
```

## 📊 Recursos Creados (Fase 1)

| Recurso | Tipo | Propósito | Free Tier |
|---------|------|-----------|-----------|
| VPC | aws_vpc | Red virtual privada | ✅ Sí |
| Subnets | aws_subnet | Subredes públicas y privadas | ✅ Sí |
| Internet Gateway | aws_internet_gateway | Salida a Internet | ✅ Sí |
| Security Groups | aws_security_group | Firewall para RDS y ECS | ✅ Sí |
| RDS PostgreSQL | aws_db_instance | Base de datos | ✅ 750h/mes (t3.micro) |
| ECR | aws_ecr_repository | Registro de imágenes Docker | ✅ 500 MB gratis |
| Secrets Manager | aws_secretsmanager_secret | Credenciales DB | ⚠️ $0.40/mes por secreto |

## 🧹 Destruir Infraestructura (Cuidado)

Para eliminar todos los recursos creados:

```bash
# Ver qué se eliminará
terraform plan -destroy

# Destruir (¡CUIDADO! Esto elimina TODO)
terraform destroy
```

## 🔄 Próximos Pasos (Fase 2)

La Fase 2 incluirá:
- ECS Cluster (Fargate)
- Task Definition
- ECS Service
- Application Load Balancer (ALB) o IP pública
- IAM Roles para ECS Tasks
- CloudWatch Logs

## 📝 Notas Importantes

1. **Estado de Terraform:** Por defecto, el estado se guarda localmente en `terraform.tfstate`. Para producción, considera usar un backend remoto (S3 + DynamoDB).

2. **Costos:** Aunque usamos Free Tier en lo posible, algunos recursos como Secrets Manager y backups de RDS tienen costo mínimo.

3. **Skip Final Snapshot:** Configurado en `true` para desarrollo. En producción, cámbialo a `false`.

4. **Multi-AZ:** Configurado en `false` para ahorrar costos. Para alta disponibilidad, cámbialo a `true`.

## 🐛 Troubleshooting

### Error: "Error acquiring the state lock"

Otro proceso de Terraform está corriendo. Espera a que termine o elimina el lock:

```bash
terraform force-unlock <LOCK_ID>
```

### Error: "Insufficient permissions"

Verifica que tu usuario de AWS tiene los permisos necesarios:

```bash
aws sts get-caller-identity
```

### Error: "DB instance already exists"

Ya existe una instancia RDS con ese nombre. Cambia `project_name` o `environment` en `terraform.tfvars`.

## 📚 Referencias

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Free Tier](https://aws.amazon.com/free/)
- [RDS PostgreSQL Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
