# 🔌 Conectar a RDS desde Gestor Local (DBeaver, pgAdmin, TablePlus, etc.)

## 📋 Datos de Conexión

```
Host:     checkout-commerce-prod-db.cc7g82gws5nk.us-east-1.rds.amazonaws.com
Port:     5432
Database: checkoutdb
User:     dbadmin
Password: o4(9w;M[BtHk23
SSL:      Require (o Prefer)
```

---

## 🎯 Opciones de Conexión

### **Opción 1: Acceso Directo (Temporal para Desarrollo)** ⚡

**Ventajas:** Rápido y sencillo  
**Desventajas:** Menos seguro, expone RDS a internet temporalmente  
**Recomendado para:** Desarrollo y debugging

#### Pasos:

**1. Obtener tu IP pública:**

```bash
curl -4 ifconfig.me
```

**2. Actualizar Terraform para permitir acceso:**

Edita `terraform/main.tf` y agrega una regla de ingreso temporal en el Security Group de RDS (línea 112):

```hcl
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-${var.environment}-rds-sg"
  description = "Security group for RDS PostgreSQL instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from ECS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  # 🔓 TEMPORAL: Permitir acceso desde tu IP local
  ingress {
    description = "PostgreSQL from my local IP - REMOVE IN PRODUCTION"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["TU_IP_PUBLICA/32"]  # ⚠️ Reemplaza TU_IP_PUBLICA
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
```

**3. Habilitar acceso público en `terraform/terraform.tfvars`:**

```hcl
db_publicly_accessible   = true  # Cambiar temporalmente a true
```

**4. Aplicar los cambios:**

```bash
cd terraform
terraform apply -auto-approve
cd ..
```

**5. Conectar desde tu gestor de BD:**

**DBeaver:**
- Host: `checkout-commerce-prod-db.cc7g82gws5nk.us-east-1.rds.amazonaws.com`
- Port: `5432`
- Database: `checkoutdb`
- User: `dbadmin`
- Password: `o4(9w;M[BtHk23`
- SSL: Marcar "Use SSL"

**pgAdmin:**
- Host: `checkout-commerce-prod-db.cc7g82gws5nk.us-east-1.rds.amazonaws.com`
- Port: `5432`
- Maintenance database: `checkoutdb`
- Username: `dbadmin`
- Password: `o4(9w;M[BtHk23`
- SSL mode: `require`

**TablePlus:**
- Host: `checkout-commerce-prod-db.cc7g82gws5nk.us-east-1.rds.amazonaws.com`
- Port: `5432`
- User: `dbadmin`
- Password: `o4(9w;M[BtHk23`
- Database: `checkoutdb`
- Use SSL: ✅

**⚠️ IMPORTANTE: Revertir después de terminar**

Cuando termines de trabajar con la BD:

1. Elimina la regla de ingreso temporal en `terraform/main.tf`
2. Cambia `db_publicly_accessible = false` en `terraform.tfvars`
3. Aplica: `cd terraform && terraform apply -auto-approve`

---

### **Opción 2: Túnel SSH via ECS Task (Producción - Más Seguro)** 🔒

**Ventajas:** No expone RDS a internet  
**Desventajas:** Más complejo de configurar  
**Recomendado para:** Producción

#### Usando AWS Systems Manager Session Manager:

**1. Instalar Session Manager Plugin:**

```bash
# macOS
brew install --cask session-manager-plugin

# Linux/Windows: https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html
```

**2. Crear un Port Forward:**

```bash
# Obtener el Task ID de ECS
TASK_ID=$(aws ecs list-tasks \
  --cluster checkout-commerce-prod-cluster \
  --region us-east-1 \
  --query 'taskArns[0]' \
  --output text | awk -F/ '{print $NF}')

# Obtener el Runtime ID del contenedor
RUNTIME_ID=$(aws ecs describe-tasks \
  --cluster checkout-commerce-prod-cluster \
  --tasks $TASK_ID \
  --region us-east-1 \
  --query 'tasks[0].containers[0].runtimeId' \
  --output text)

# Crear port forwarding (puerto local 5433 -> RDS puerto 5432)
aws ecs execute-command \
  --cluster checkout-commerce-prod-cluster \
  --task $TASK_ID \
  --container checkout-commerce-app \
  --command "/bin/sh" \
  --interactive \
  --region us-east-1
```

Luego en tu gestor de BD:
- Host: `localhost`
- Port: `5433`
- Database: `checkoutdb`
- User: `dbadmin`
- Password: `o4(9w;M[BtHk23`

**Nota:** Esta opción requiere que el Task Definition tenga `enable_execute_command = true`

---

### **Opción 3: Bastion Host EC2 (Solo para casos específicos)** 🖥️

Si necesitas acceso frecuente y seguro a RDS, considera crear un Bastion Host:

1. Crear una instancia EC2 t2.micro en una subnet pública
2. Configurar Security Group para permitir SSH desde tu IP
3. Usar túnel SSH para port forwarding:

```bash
ssh -i tu-key.pem -L 5433:checkout-commerce-prod-db.cc7g82gws5nk.us-east-1.rds.amazonaws.com:5432 ec2-user@bastion-public-ip
```

4. Conectar tu gestor a `localhost:5433`

**Costo adicional:** ~$3-5/mes para t2.micro (puede usar Free Tier si disponible)

---

## 🔧 Script de Conexión Rápida

Usa este script para habilitar/deshabilitar acceso rápidamente:

```bash
#!/bin/bash
# enable-rds-access.sh

# Obtener tu IP
MY_IP=$(curl -4 -s ifconfig.me)
echo "Tu IP pública: $MY_IP"

# Backup de main.tf
cp terraform/main.tf terraform/main.tf.backup

# Agregar regla temporal
sed -i.tmp '/ingress {/a\
  ingress {\
    description = "Temporary local access"\
    from_port   = 5432\
    to_port     = 5432\
    protocol    = "tcp"\
    cidr_blocks = ["'$MY_IP'/32"]\
  }
' terraform/main.tf

# Cambiar publicly_accessible
sed -i.tmp 's/db_publicly_accessible   = false/db_publicly_accessible   = true/' terraform/terraform.tfvars

echo "Aplicando cambios..."
cd terraform
terraform apply -auto-approve
cd ..

echo "✅ Acceso RDS habilitado desde $MY_IP"
echo ""
echo "🔌 Datos de conexión:"
echo "  Host:     checkout-commerce-prod-db.cc7g82gws5nk.us-east-1.rds.amazonaws.com"
echo "  Port:     5432"
echo "  Database: checkoutdb"
echo "  User:     dbadmin"
echo "  Password: o4(9w;M[BtHk23"
echo "  SSL:      Require"
echo ""
echo "⚠️  Recuerda ejecutar disable-rds-access.sh cuando termines"
```

---

## ❓ Troubleshooting

### Error: "Connection timeout"

**Causa:** Security Group no permite tu IP o RDS no es públicamente accesible

**Solución:**
1. Verifica que aplicaste `terraform apply`
2. Verifica tu IP actual: `curl ifconfig.me`
3. Revisa Security Group en AWS Console: EC2 → Security Groups → busca "rds-sg"

### Error: "Password authentication failed"

**Causa:** Contraseña incorrecta

**Solución:**
Verifica la contraseña en Secrets Manager:
```bash
aws secretsmanager get-secret-value \
  --secret-id checkout-commerce/prod/db-credentials \
  --region us-east-1 \
  --query SecretString \
  --output text | jq -r '.password'
```

### Error: "SSL required"

**Causa:** RDS requiere conexión SSL

**Solución:**
- Habilita SSL en tu gestor de BD
- Modo SSL: `require` o `prefer`
- No es necesario descargar certificado RDS

### Mi IP cambió

Si tu IP pública cambia (común en conexiones residenciales):

1. Obtén tu nueva IP: `curl ifconfig.me`
2. Actualiza la regla en `terraform/main.tf`
3. Ejecuta: `cd terraform && terraform apply -auto-approve`

---

## 🎯 Recomendación

Para **desarrollo local ocasional**: Usa **Opción 1** (Acceso Directo Temporal)

Para **uso frecuente en producción**: Usa **Opción 2** (Session Manager) o **Opción 3** (Bastion Host)

**Nunca dejes `db_publicly_accessible = true` en producción sin una razón específica.**

---

## ✅ Verificar Conexión

Una vez conectado, ejecuta:

```sql
-- Ver todas las tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Ver migraciones aplicadas
SELECT * FROM migrations ORDER BY timestamp DESC;

-- Ver roles creados
SELECT * FROM roles;

-- Ver productos
SELECT * FROM products;
```

---

**Fecha:** 2 de marzo de 2026  
**Versión:** 1.0
