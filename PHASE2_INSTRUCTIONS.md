# 🚀 Fase 2: Despliegue en ECS + Fargate + ALB

Esta fase despliega tu aplicación NestJS en contenedores usando AWS ECS Fargate con un Application Load Balancer.

## 📋 Prerequisitos

1. ✅ Fase 1 completada (VPC, RDS, ECR)
2. ✅ Imagen Docker construida y subida al ECR
3. ✅ Endpoint `/api/health` en tu aplicación (ya añadido)

## 🏗️ Recursos que se Crearán

### **ECS (Elastic Container Service)**
- ECS Cluster (Fargate)
- Task Definition (definición de contenedor)
- ECS Service (mantiene los contenedores corriendo)

### **Load Balancer**
- Application Load Balancer (ALB)
- Target Group
- HTTP Listener (puerto 80)
- Security Group para ALB

### **IAM (Permisos)**
- ECS Task Execution Role (para ECR y CloudWatch)
- ECS Task Role (para permisos de aplicación)

### **Monitoreo**
- CloudWatch Log Group (logs de la aplicación)

---

## 🐳 Paso 1: Construir y Subir la Imagen Docker al ECR

Antes de aplicar Terraform, necesitas tener una imagen en ECR.

```bash
# 1. Autenticarse en ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 150506369483.dkr.ecr.us-east-1.amazonaws.com

# 2. Construir la imagen
docker build -t checkout-commerce-prod .

# 3. Etiquetar la imagen
docker tag checkout-commerce-prod:latest \
  150506369483.dkr.ecr.us-east-1.amazonaws.com/checkout-commerce-prod:latest

# 4. Subir al ECR
docker push 150506369483.dkr.ecr.us-east-1.amazonaws.com/checkout-commerce-prod:latest
```

**⏱️ Tiempo estimado:** 5-10 minutos (dependiendo de tu conexión)

---

## ⚙️ Paso 2: Configurar Variables (Opcional)

El archivo `terraform.tfvars` ya tiene valores por defecto optimizados. Si quieres personalizarlos:

```bash
cd terraform
nano terraform.tfvars
```

**Variables clave para ECS:**
```hcl
# Recursos del contenedor (Free Tier eligible)
ecs_task_cpu       = 256    # 0.25 vCPU
ecs_task_memory    = 512    # 512 MB

# Número de instancias
ecs_desired_count  = 1      # Cuántas tareas correr

# Puerto de la aplicación
app_port           = 3000   # NestJS default

# Health check
health_check_path  = "/api/health"

# Load Balancer
enable_alb         = true   # false para ahorrar costos (~$16/mes)
```

---

## 🚀 Paso 3: Aplicar la Infraestructura de Fase 2

```bash
cd terraform

# 1. Validar la configuración
terraform validate

# 2. Ver qué recursos se crearán
terraform plan

# 3. Aplicar los cambios
terraform apply
```

**Recursos nuevos que se crearán:**
- 2 IAM Roles
- 1 CloudWatch Log Group
- 1 ALB + Security Group
- 1 Target Group
- 1 Listener HTTP
- 1 ECS Cluster
- 1 ECS Task Definition
- 1 ECS Service

**⏱️ Tiempo estimado:** 5-8 minutos

---

## ✅ Paso 4: Verificar el Despliegue

Una vez que `terraform apply` termine exitosamente:

```bash
# Ver todos los outputs
terraform output

# Ver específicamente la URL de la aplicación
terraform output application_url
```

Deberías ver algo como:
```
application_url = "http://checkout-commerce-prod-alb-123456789.us-east-1.elb.amazonaws.com"
```

### Probar la Aplicación

```bash
# URL del ALB (cópiala del output)
ALB_URL=$(terraform output -raw alb_url)

# Probar el health check
curl $ALB_URL/api/health

# Debería responder:
# {"status":"ok","timestamp":"2026-03-01T...","uptime":123.45}

# Probar el endpoint principal
curl $ALB_URL/
```

---

## 📊 Monitoreo y Logs

### Ver Logs en Tiempo Real

```bash
# Ver los últimos logs
aws logs tail /ecs/checkout-commerce-prod --follow

# Ver logs de las últimas 2 horas
aws logs tail /ecs/checkout-commerce-prod --since 2h
```

### Ver Logs en AWS Console

1. Ve a **CloudWatch** → **Log groups**
2. Busca `/ecs/checkout-commerce-prod`
3. Haz clic en el log stream más reciente

### Ver Estado de ECS

1. Ve a **ECS** → **Clusters**
2. Haz clic en `checkout-commerce-prod-cluster`
3. Ve a la pestaña **Tasks** para ver tareas corriendo
4. Ve a la pestaña **Services** para verificar el servicio

---

## 🔧 Troubleshooting

### Error: "No tasks running"

Verifica el estado de las tareas:
```bash
aws ecs list-tasks --cluster checkout-commerce-prod-cluster
aws ecs describe-tasks --cluster checkout-commerce-prod-cluster --tasks <TASK-ARN>
```

**Causas comunes:**
1. ❌ No hay imagen en ECR → Subir imagen primero
2. ❌ Health check falla → Verificar que `/api/health` responde 200
3. ❌ Error de permisos IAM → Verificar roles de IAM

### Error: "Target deregistration"

El ALB está marcando las tareas como unhealthy.

**Soluciones:**
1. Verifica que el endpoint `/api/health` responda en el puerto 3000
2. Revisa los logs en CloudWatch
3. Aumenta el `startPeriod` en el health check (60 segundos)

### Ver por qué fallan las tareas

```bash
# Obtener el ARN de la última tarea
TASK_ARN=$(aws ecs list-tasks --cluster checkout-commerce-prod-cluster \
  --desired-status STOPPED --query 'taskArns[0]' --output text)

# Ver detalles de por qué falló
aws ecs describe-tasks --cluster checkout-commerce-prod-cluster \
  --tasks $TASK_ARN --query 'tasks[0].containers[0]'
```

---

## 💰 Costos de Fase 2

| Recurso | Free Tier | Costo Estimado/Mes |
|---------|-----------|-------------------|
| Fargate (256 CPU, 512 MB) | No | ~$5-7/mes |
| Application Load Balancer | No | ~$16/mes |
| CloudWatch Logs (5 GB) | 5 GB gratis | $0 |
| Data Transfer | 1 GB gratis | $0-2/mes |
| **Total Fase 1 + 2** | | **~$22-26/mes** |

### 💡 Opción para Ahorrar Costos

Si quieres evitar el costo del ALB (~$16/mes), puedes:

1. Deshabilitar el ALB en `terraform.tfvars`:
   ```hcl
   enable_alb = false
   ```

2. Volver a aplicar:
   ```bash
   terraform apply
   ```

3. Acceder directamente a la IP pública de la tarea ECS:
   - Ve a **ECS** → **Clusters** → **Tasks**
   - Copia la IP pública de la tarea
   - Accede via `http://<IP-PUBLICA>:3000/api/health`

**Costo sin ALB:** ~$6-8/mes (solo Fargate)

---

## 🔄 Actualizar la Aplicación

Cuando hagas cambios en tu código:

```bash
# 1. Reconstruir y subir la imagen
docker build -t checkout-commerce-prod .
docker tag checkout-commerce-prod:latest \
  150506369483.dkr.ecr.us-east-1.amazonaws.com/checkout-commerce-prod:latest
docker push 150506369483.dkr.ecr.us-east-1.amazonaws.com/checkout-commerce-prod:latest

# 2. Forzar un nuevo despliegue en ECS
aws ecs update-service \
  --cluster checkout-commerce-prod-cluster \
  --service checkout-commerce-prod-service \
  --force-new-deployment
```

O esperar a la **Fase 3** donde esto será automático con GitHub Actions. 🚀

---

## 🎯 Variables de Entorno

Tu aplicación NestJS tendrá acceso automáticamente a estas variables:

- `NODE_ENV=production`
- `PORT=3000`
- `DATABASE_URL` (host de RDS)
- `DB_USERNAME` (desde Secrets Manager)
- `DB_PASSWORD` (desde Secrets Manager)
- `DB_NAME` (nombre de la base de datos)
- `DB_PORT` (5432)

Estas se configuran automáticamente desde AWS Secrets Manager.

---

## 🧹 Destruir Recursos (Cuidado)

Para eliminar todos los recursos de Fase 2:

```bash
# Ver qué se eliminará
terraform plan -destroy

# Eliminar recursos
terraform destroy
```

⚠️ **Esto NO eliminará:** VPC, RDS, ECR (recursos de Fase 1)

---

## ✅ Checklist de Fase 2

- [ ] Imagen Docker construida y subida al ECR
- [ ] `terraform apply` ejecutado exitosamente
- [ ] ALB creado y respondiendo
- [ ] Health check en `/api/health` responde 200 OK
- [ ] Logs visibles en CloudWatch
- [ ] Endpoint principal accesible via ALB URL

---

## 🎉 ¡Fase 2 Completada!

Tu aplicación NestJS ahora está:
- ✅ Corriendo en contenedores (Fargate)
- ✅ Balanceada con ALB
- ✅ Conectada a RDS PostgreSQL
- ✅ Con logs en CloudWatch
- ✅ Con health checks automáticos

**Próximo paso:** Fase 3 - Pipeline CI/CD con GitHub Actions para deploys automáticos. 🚀
