#!/bin/bash
# Script para deshabilitar acceso temporal a RDS (volver a configuración segura)

set -e

echo "🔒 Deshabilitando acceso temporal a RDS..."
echo ""

# Eliminar regla temporal del Security Group
echo "📝 Eliminando regla temporal del Security Group..."

if grep -q "TEMPORAL: Permitir acceso desde tu IP local" terraform/main.tf; then
  # Eliminar el bloque temporal completo
  sed -i.bak '/# 🔓 TEMPORAL: Permitir acceso desde tu IP local/,/^  }/d' terraform/main.tf
  echo "✅ Regla temporal eliminada"
else
  echo "⚠️  No se encontró regla temporal (puede que ya esté eliminada)"
fi

echo ""

# Cambiar publicly_accessible a false
echo "🔐 Deshabilitando acceso público a RDS..."
sed -i.bak 's/db_publicly_accessible   = true/db_publicly_accessible   = false/' terraform/terraform.tfvars
echo "✅ Acceso público deshabilitado"
echo ""

# Aplicar cambios con Terraform
echo "🚀 Aplicando cambios con Terraform..."
cd terraform
terraform apply -auto-approve
cd ..

# Limpiar archivos backup
rm -f terraform/main.tf.bak terraform/terraform.tfvars.bak

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ACCESO RDS DESHABILITADO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔒 RDS ahora solo es accesible desde ECS Tasks"
echo "   (Configuración de producción restaurada)"
echo ""
