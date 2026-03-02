# 🔧 Configuración de Variables de Entorno

## ❌ Error Actual

```
Error: JWT_SECRET is not defined in environment variables
```

Tu aplicación NestJS necesita variables de entorno que no están configuradas en ECS.

## ✅ Solución - 3 Pasos

### **Paso 1: Actualizar `terraform.tfvars` con tus credenciales reales**

Edita `terraform/terraform.tfvars` y reemplaza estos valores:

```hcl
# ⚠️ IMPORTANTE: Cambia estos valores por los reales

# JWT - Genera un secret seguro
jwt_secret = "tu-secret-jwt-super-seguro-minimo-32-caracteres-random"
jwt_expires_in = "1h"  # o "7d" para testing

# Wompi - Obtén tus credenciales de https://comercios.wompi.co
wompi_public_key     = "pub_test_XXXXXXXXXX"  # O pub_prod_ para producción
wompi_private_key    = "prv_test_XXXXXXXXXX"  # O prv_prod_ para producción
wompi_api_url        = "https://sandbox.wompi.co/v1"  # O https://production.wompi.co/v1
wompi_events_secret  = "tu-secret-de-eventos-wompi"

# Frontend - URL de tu aplicación frontend
frontend_url = "http://localhost:3001"  # O tu dominio real
```

**💡 Para generar un JWT_SECRET seguro:**
```bash
# Opción 1: OpenSSL
openssl rand -base64 32

# Opción 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### **Paso 2: Aplicar cambios con Terraform**

```bash
cd terraform
terraform apply
```

Esto actualizará la **task definition** con las nuevas variables de entorno.

### **Paso 3: Forzar nuevo deployment en ECS**

```bash
aws ecs update-service \
  --cluster checkout-commerce-prod-cluster \
  --service checkout-commerce-prod-service \
  --force-new-deployment \
  --region us-east-1
```

## 🔍 Verificar que funcionó

Espera 2-3 minutos y verifica:

```bash
# Ver logs en tiempo real
aws logs tail /ecs/checkout-commerce-prod --follow --region us-east-1
```

Deberías ver:
```
[Nest] Application successfully started
```

Luego prueba el endpoint:
```bash
curl http://checkout-commerce-prod-alb-686551057.us-east-1.elb.amazonaws.com/api/health
```

Respuesta esperada:
```json
{"status":"ok","timestamp":"2026-03-02T...","uptime":123.45}
```

## 📝 Variables agregadas a ECS

| Variable | Descripción | Fuente |
|----------|-------------|--------|
| `NODE_ENV` | production | Hardcoded |
| `PORT` | 3000 | Variable Terraform |
| `JWT_SECRET` | Secret para firmar tokens | terraform.tfvars |
| `JWT_EXPIRES_IN` | Tiempo de expiración tokens | terraform.tfvars |
| `WOMPI_PUBLIC_KEY` | API key pública Wompi | terraform.tfvars |
| `WOMPI_PRIVATE_KEY` | API key privada Wompi | terraform.tfvars |
| `WOMPI_API_URL` | URL API Wompi | terraform.tfvars |
| `WOMPI_EVENTS_SECRET` | Secret para webhooks | terraform.tfvars |
| `FRONTEND_URL` | URL frontend para CORS | terraform.tfvars |
| `DB_HOST` | Endpoint RDS | Secrets Manager |
| `DB_USERNAME` | Usuario DB | Secrets Manager |
| `DB_PASSWORD` | Password DB | Secrets Manager |
| `DB_DATABASE` | Nombre DB | Secrets Manager |
| `DB_PORT` | Puerto DB (5432) | Secrets Manager |

## 🔐 Seguridad

✅ **Buenas prácticas implementadas:**
- Las credenciales de DB están en **AWS Secrets Manager** (encriptadas)
- Las variables sensibles en Terraform están marcadas como `sensitive = true`
- El archivo `terraform.tfvars` está en `.gitignore` (no se commitea)

⚠️ **NUNCA commitees `terraform.tfvars` con credenciales reales a Git**

## 🚨 Troubleshooting

### Error: "Variable not declared"
```bash
cd terraform
terraform init
terraform validate
```

### Ver valores de variables (sin mostrar sensibles)
```bash
terraform show
```

### Ver outputs actuales
```bash
terraform output
```

### Verificar task definition actual
```bash
aws ecs describe-task-definition \
  --task-definition checkout-commerce-prod \
  --query 'taskDefinition.containerDefinitions[0].environment' \
  --region us-east-1
```
