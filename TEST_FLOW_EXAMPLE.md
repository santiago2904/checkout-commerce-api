# Ejemplo Completo de Flujo de Checkout

Esta guía proporciona un ejemplo paso a paso para probar el flujo completo de checkout con comandos reales.

## Pre-requisitos

```bash
# 1. Iniciar PostgreSQL (si no está corriendo)
docker run --name checkout-postgres \
  -e POSTGRES_PASSWORD=admin123 \
  -e POSTGRES_USER=zarco \
  -e POSTGRES_DB=checkout \
  -p 5432:5432 \
  -d postgres:15-alpine

# 2. Ejecutar migraciones
npm run migration:run

# 3. Ejecutar seeders (crea roles y productos)
npm run seed:run

# 4. Iniciar servidor
npm run start:dev
```

## Paso 1: Registrar Usuario y Obtener Token

```bash
# Registrar un nuevo usuario
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-buyer@example.com",
    "password": "SecurePass123!",
    "firstName": "Maria",
    "lastName": "Garcia"
  }' | jq '.'
```

**Respuesta esperada:**
```json
{
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "test-buyer@example.com",
      "firstName": "Maria",
      "lastName": "Garcia"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6InRlc3QtYnV5ZXJAZXhhbXBsZS5jb20iLCJyb2xlcyI6WyJDVVNUT01FUiJdLCJpYXQiOjE3MDk3MzYwMDAsImV4cCI6MTcwOTgyMjQwMH0.xyz..."
  }
}
```

> **🔑 Guarda el token:** Exporta el token como variable de entorno:

```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."
```

## Paso 2: Consultar Productos Disponibles

```bash
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Respuesta esperada (parcial):**
```json
{
  "statusCode": 200,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": "prod-uuid-1",
      "name": "Laptop Dell XPS 13",
      "description": "High-performance laptop with Intel Core i7, 16GB RAM, 512GB SSD",
      "price": 1299.99,
      "stock": 10,
      "isActive": true
    },
    {
      "id": "prod-uuid-2",
      "name": "iPhone 15 Pro",
      "description": "Latest Apple iPhone with A17 Pro chip, 256GB storage",
      "price": 999.99,
      "stock": 25,
      "isActive": true
    }
  ]
}
```

> **📝 Copia un Product ID:** Guarda el ID del primer producto para el siguiente paso:

```bash
export PRODUCT_ID="prod-uuid-1"
```

## Paso 3: Procesar Checkout (Compra de 2 Laptops)

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"items\": [
      {
        \"productId\": \"$PRODUCT_ID\",
        \"quantity\": 2
      }
    ],
    \"paymentMethod\": {
      \"type\": \"CARD\",
      \"token\": \"tok_sandbox_visa_4242\",
      \"installments\": 1
    },
    \"shippingAddress\": {
      \"addressLine1\": \"Calle 100 #15-20\",
      \"addressLine2\": \"Torre A, Piso 5\",
      \"city\": \"Bogotá\",
      \"region\": \"Cundinamarca\",
      \"country\": \"Colombia\",
      \"postalCode\": \"110111\",
      \"recipientName\": \"Maria Garcia\",
      \"recipientPhone\": \"+57 310 555 1234\"
    },
    \"customerEmail\": \"test-buyer@example.com\"
  }" | jq '.'
```

**Respuesta esperada:**
```json
{
  "statusCode": 201,
  "message": "Checkout processed successfully",
  "data": {
    "transactionId": "txn-uuid-abc123",
    "transactionNumber": "TXN-2026-000001",
    "wompiTransactionId": "wompi-txn-xyz789",
    "status": "PENDING",
    "amount": 2599.98,
    "currency": "USD",
    "reference": "REF-1709736000-abc123",
    "paymentMethod": "CARD",
    "redirectUrl": null
  }
}
```

> **💾 Guarda el Transaction ID:**

```bash
export TRANSACTION_ID="txn-uuid-abc123"
```

### ⚠️ Estado del Sistema en este Momento:
- ✅ Transaction creada con status PENDING
- ✅ Transaction Items guardados (2 Laptops @ $1,299.99 cada una)
- ❌ Stock **NO** reducido aún (sigue en 10)
- ❌ Delivery **NO** creado aún
- ⏳ Esperando respuesta de Wompi...

## Paso 4: Polling del Estado (Cada 5 segundos)

### Intento 1: Probablemente PENDING

```bash
curl -X GET "http://localhost:3000/api/checkout/status/$TRANSACTION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Respuesta:**
```json
{
  "statusCode": 200,
  "message": "Transaction status retrieved",
  "data": {
    "transactionId": "txn-uuid-abc123",
    "transactionNumber": "TXN-2026-000001",
    "status": "PENDING",
    "amount": 2599.98,
    "currency": "USD",
    "reference": "REF-1709736000-abc123",
    "wompiTransactionId": "wompi-txn-xyz789",
    "statusChanged": false
  }
}
```

> **🔁 Espera 5 segundos y vuelve a intentar**

```bash
sleep 5
curl -X GET "http://localhost:3000/api/checkout/status/$TRANSACTION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### Intento 2-N: Hasta obtener estado final

Continúa haciendo polling cada 5 segundos hasta que `status` cambie a `APPROVED`, `DECLINED`, o `ERROR`.

### Estado Final: APPROVED ✅

```json
{
  "statusCode": 200,
  "message": "Transaction status retrieved",
  "data": {
    "transactionId": "txn-uuid-abc123",
    "transactionNumber": "TXN-2026-000001",
    "status": "APPROVED",
    "amount": 2599.98,
    "currency": "USD",
    "reference": "REF-1709736000-abc123",
    "wompiTransactionId": "wompi-txn-xyz789",
    "statusChanged": true,
    "deliveryId": "delivery-uuid-def456"
  }
}
```

### ✅ ¡Fulfillment Ejecutado Automáticamente!

Cuando el status cambió de PENDING → APPROVED, el sistema ejecutó:

1. **Stock Reducido**: Laptop Dell XPS 13 stock: 10 → 8 (vendimos 2)
2. **Delivery Creado**: ID `delivery-uuid-def456` con status PENDING
3. **Audit Logs Creados**: 4 eventos registrados en `audit_log`
4. **TODO Email**: Se enviará confirmación (pendiente de implementar)

## Paso 5: Verificar en Base de Datos

Conéctate a PostgreSQL para verificar los cambios:

```bash
docker exec -it checkout-postgres psql -U zarco -d checkout
```

### Verificar Stock Reducido

```sql
SELECT id, name, stock 
FROM product 
WHERE name LIKE '%Laptop Dell%';
```

**Resultado esperado:**
```
                  id                  |       name        | stock
--------------------------------------+------------------+-------
 prod-uuid-1                          | Laptop Dell XPS 13|   8
```

✅ Stock reducido de 10 → 8 (2 unidades vendidas)

### Verificar Transaction Items (Snapshot)

```sql
SELECT 
  ti.id,
  ti."productName",
  ti.quantity,
  ti."unitPrice",
  ti.subtotal
FROM transaction_item ti
WHERE ti."transactionId" = 'txn-uuid-abc123';
```

**Resultado esperado:**
```
           id           |    productName      | quantity | unitPrice | subtotal
------------------------+---------------------+----------+-----------+----------
 ti-uuid-1              | Laptop Dell XPS 13  |    2     | 1299.99   | 2599.98
```

✅ Los items capturan el precio y nombre **al momento de la compra**

### Verificar Delivery Creado

```sql
SELECT 
  d.id,
  d.status,
  d."shippingAddress",
  d."trackingNumber",
  d."createdAt"
FROM delivery d
WHERE d."transactionId" = 'txn-uuid-abc123';
```

**Resultado esperado:**
```
         id          | status  |     shippingAddress       | trackingNumber |        createdAt
---------------------+---------+---------------------------+----------------+-------------------------
 delivery-uuid-def456| PENDING | Calle 100 #15-20, Torre A | TRK-1709736000 | 2026-02-27 10:30:15.123
```

✅ Delivery creado con status PENDING

### Verificar Audit Logs del Fulfillment

```sql
SELECT 
  al.action,
  al.metadata->>'transactionNumber' as txn_number,
  al.metadata->>'itemsCount' as items,
  al."createdAt"
FROM audit_log al
WHERE al.metadata->>'transactionId' = 'txn-uuid-abc123'
AND al.action LIKE 'FULFILLMENT_%'
ORDER BY al."createdAt";
```

**Resultado esperado:**
```
           action                | txn_number      | items |        createdAt
---------------------------------+-----------------+-------+-------------------------
 FULFILLMENT_APPROVED_START      | TXN-2026-000001 | NULL  | 2026-02-27 10:30:15.001
 FULFILLMENT_STOCK_REDUCED       | TXN-2026-000001 | 2     | 2026-02-27 10:30:15.023
 FULFILLMENT_DELIVERY_CREATED    | TXN-2026-000001 | 2     | 2026-02-27 10:30:15.045
 FULFILLMENT_APPROVED_SUCCESS    | TXN-2026-000001 | 2     | 2026-02-27 10:30:15.067
```

✅ 4 eventos de auditoría registrados en orden cronológico

### Salir de PostgreSQL

```sql
\q
```

## Paso 6: Probar con Tarjeta Declinada

Ahora probemos el flujo cuando el pago es rechazado:

```bash
# Usa una tarjeta de prueba que será declinada
curl -X POST http://localhost:3000/api/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"items\": [
      {
        \"productId\": \"$PRODUCT_ID\",
        \"quantity\": 1
      }
    ],
    \"paymentMethod\": {
      \"type\": \"CARD\",
      \"token\": \"tok_sandbox_declined\",
      \"installments\": 1
    },
    \"shippingAddress\": {
      \"addressLine1\": \"Carrera 7 #50-30\",
      \"city\": \"Bogotá\",
      \"region\": \"Cundinamarca\",
      \"country\": \"Colombia\",
      \"postalCode\": \"110111\",
      \"recipientName\": \"Maria Garcia\",
      \"recipientPhone\": \"+57 310 555 1234\"
    },
    \"customerEmail\": \"test-buyer@example.com\"
  }" | jq '.data.transactionId' -r
```

Guarda el nuevo transaction ID:

```bash
export DECLINED_TXN="<nuevo-transaction-id>"
```

Haz polling:

```bash
# Intenta varias veces hasta obtener estado final
for i in {1..12}; do
  echo "🔄 Intento $i/12..."
  curl -s -X GET "http://localhost:3000/api/checkout/status/$DECLINED_TXN" \
    -H "Authorization: Bearer $TOKEN" | jq '.data.status, .data.errorMessage'
  sleep 5
done
```

**Estado Final: DECLINED**
```json
{
  "statusCode": 200,
  "message": "Transaction status retrieved",
  "data": {
    "transactionId": "declined-txn-id",
    "status": "DECLINED",
    "errorCode": "INSUFFICIENT_FUNDS",
    "errorMessage": "The payment was declined by the bank",
    "statusChanged": true
  }
}
```

### ❌ Fulfillment NO Ejecutado

Cuando el status es DECLINED:
- ❌ Stock **NO** reducido (permanece en 8)
- ❌ Delivery **NO** creado
- ✅ Audit Log: `FULFILLMENT_DECLINED_PROCESSED` registrado
- 📧 TODO: Se notificará al cliente (pendiente)

## Resumen del Flujo Completo

```
1. Register User       → GET JWT Token
2. GET /products       → SELECT Product ID
3. POST /checkout      → Transaction ID (PENDING)
                          ├─ Transaction created
                          └─ Transaction Items saved (snapshot)

4. GET /status (poll)  → Check every 5 seconds
   ├─ PENDING         → Keep polling
   ├─ APPROVED        → ✅ FULFILLMENT EXECUTED
   │                     ├─ Stock reduced
   │                     ├─ Delivery created
   │                     └─ 4 Audit logs
   ├─ DECLINED        → ❌ No fulfillment
   │                     └─ 1 Audit log (reason)
   └─ ERROR           → ❌ No fulfillment
                         └─ 1 Audit log (error details)
```

## Scripts Auxiliares

### Script de Polling Automático (Bash)

Guarda como `test-checkout-flow.sh`:

```bash
#!/bin/bash

echo "🚀 Starting complete checkout flow test..."
echo ""

# Step 1: Register
echo "📝 Step 1: Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "auto-test-'$(date +%s)'@example.com",
    "password": "AutoTest123!",
    "firstName": "Auto",
    "lastName": "Tester"
  }')

TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.accessToken')
echo "✅ User registered. Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Get Products
echo "📦 Step 2: Fetching products..."
PRODUCTS=$(curl -s -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer $TOKEN")

PRODUCT_ID=$(echo $PRODUCTS | jq -r '.data[0].id')
PRODUCT_NAME=$(echo $PRODUCTS | jq -r '.data[0].name')
echo "✅ Product selected: $PRODUCT_NAME ($PRODUCT_ID)"
echo ""

# Step 3: Checkout
echo "💳 Step 3: Processing checkout..."
CHECKOUT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"items\": [{\"productId\": \"$PRODUCT_ID\", \"quantity\": 1}],
    \"paymentMethod\": {\"type\": \"CARD\", \"token\": \"tok_sandbox_visa_4242\", \"installments\": 1},
    \"shippingAddress\": {
      \"addressLine1\": \"Test Address 123\",
      \"city\": \"Bogotá\",
      \"region\": \"Cundinamarca\",
      \"country\": \"Colombia\",
      \"postalCode\": \"110111\",
      \"recipientName\": \"Auto Tester\",
      \"recipientPhone\": \"+57 310 555 0000\"
    },
    \"customerEmail\": \"auto-test@example.com\"
  }")

TRANSACTION_ID=$(echo $CHECKOUT_RESPONSE | jq -r '.data.transactionId')
echo "✅ Transaction created: $TRANSACTION_ID"
echo "   Status: PENDING"
echo ""

# Step 4: Polling
echo "🔄 Step 4: Polling for status (max 60 attempts, 5s interval)..."
for i in {1..60}; do
  STATUS_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/checkout/status/$TRANSACTION_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  STATUS=$(echo $STATUS_RESPONSE | jq -r '.data.status')
  STATUS_CHANGED=$(echo $STATUS_RESPONSE | jq -r '.data.statusChanged')
  
  echo "   Attempt $i/60 - Status: $STATUS"
  
  if [ "$STATUS" != "PENDING" ]; then
    echo ""
    echo "🎉 Final status reached: $STATUS"
    echo ""
    echo "📊 Full Response:"
    echo $STATUS_RESPONSE | jq '.'
    
    if [ "$STATUS" == "APPROVED" ]; then
      DELIVERY_ID=$(echo $STATUS_RESPONSE | jq -r '.data.deliveryId')
      echo ""
      echo "✅ FULFILLMENT EXECUTED:"
      echo "   - Stock reduced"
      echo "   - Delivery created: $DELIVERY_ID"
      echo "   - Audit logs recorded"
    fi
    
    exit 0
  fi
  
  sleep 5
done

echo "⏱️  Timeout: Transaction still PENDING after 5 minutes"
exit 1
```

### Ejecutar el Script

```bash
chmod +x test-checkout-flow.sh
./test-checkout-flow.sh
```

## Referencias

- [CHECKOUT_TESTING_GUIDE.md](./CHECKOUT_TESTING_GUIDE.md) - Guía completa de testing
- [FULFILLMENT.md](./FULFILLMENT.md) - Documentación del proceso de fulfillment
- [AUTHENTICATION_USAGE.md](./AUTHENTICATION_USAGE.md) - Guía de autenticación
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Configuración de base de datos
