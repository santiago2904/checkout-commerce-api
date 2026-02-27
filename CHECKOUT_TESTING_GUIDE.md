# Guía de Pruebas del Checkout (Flujo Asíncrono)

## 📋 Resumen

Esta guía te ayudará a probar el flujo completo de checkout con la integración de Wompi en modo **asíncrono**. Las transacciones ahora retornan estado `PENDING` y requieren **polling** para obtener el estado final.

---

## 🚀 Inicio Rápido

### 1. Iniciar el Servidor

```bash
# Asegúrate de que PostgreSQL está corriendo
docker ps | grep checkout-postgres

# Si no está corriendo, inícialo:
docker run --name checkout-postgres \
  -e POSTGRES_PASSWORD=admin123 \
  -e POSTGRES_USER=zarco \
  -e POSTGRES_DB=checkout \
  -p 5432:5432 \
  -d postgres:15-alpine

# Ejecutar migraciones y seeders (si no lo has hecho)
npm run migration:run
npm run seed:run

# Iniciar el servidor en modo desarrollo
npm run start:dev
```

El servidor estará disponible en: `http://localhost:3000`

---

## 🔐 Paso 1: Autenticación

### Opción A: Registrar un Nuevo Usuario

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "Test123!",
    "name": "Test Customer",
    "phone": "3001234567",
    "address": "Calle 123 #45-67, Bogotá"
  }'
```

**Respuesta esperada:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "email": "customer@test.com",
    "roleName": "CUSTOMER"
  }
}
```

### Opción B: Login con Usuario Seeded

Los seeders ya crearon usuarios de prueba:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "Customer123!"
  }'
```

**Respuesta esperada:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "customer@example.com",
    "roleName": "CUSTOMER"
  }
}
```

> ⚠️ **Importante:** Guarda el `accessToken` para los siguientes pasos.

---

## 📦 Paso 2: Consultar Productos Disponibles

```bash
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**Respuesta esperada:**
```json
{
  "products": [
    {
      "id": "product-uuid-1",
      "name": "Laptop Dell XPS 13",
      "description": "Intel i7, 16GB RAM, 512GB SSD",
      "price": 3500000,
      "stock": 10,
      "isActive": true
    },
    {
      "id": "product-uuid-2",
      "name": "iPhone 14 Pro",
      "description": "128GB, Midnight Blue",
      "price": 4200000,
      "stock": 5,
      "isActive": true
    }
  ]
}
```

> 📝 Copia el `id` del producto que quieras comprar.

---

## 💳 Paso 3: Procesar Checkout (Retorna PENDING)

### Request

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "product-uuid-1",
        "quantity": 1
      }
    ],
    "paymentMethod": "CARD",
    "cardNumber": "4242424242424242",
    "cardHolderName": "Test User",
    "cardExpiryMonth": "12",
    "cardExpiryYear": "2025",
    "cardCvv": "123",
    "installments": 1
  }'
```

### Respuesta Esperada (PENDING)

```json
{
  "transactionId": "uuid-transaction-id",
  "status": "PENDING",
  "amount": 3500000,
  "currency": "COP",
  "reference": "REF-1234567890",
  "wompiTransactionId": "wompi-txn-abc123",
  "message": "Transaction created successfully. Use the transactionId to check status."
}
```

> ⚠️ **IMPORTANTE:** 
> - La respuesta retorna `status: "PENDING"` porque Wompi procesa pagos de forma **asíncrona**
> - Debes guardar el `transactionId` y el `wompiTransactionId`
> - En este punto, el stock **NO ha sido reducido** y **NO se ha creado delivery**

---

## 🔄 Paso 4: Polling del Estado de la Transacción

Ahora debes hacer **polling** al endpoint de status hasta que la transacción tenga un estado final (`APPROVED`, `DECLINED`, o `ERROR`).

### Request de Polling

```bash
curl -X GET http://localhost:3000/api/checkout/status/TU_TRANSACTION_ID \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

Reemplaza `TU_TRANSACTION_ID` con el `transactionId` que recibiste en el paso 3.

### Posibles Respuestas

#### Caso 1: Todavía PENDING

```json
{
  "transactionId": "uuid-transaction-id",
  "status": "PENDING",
  "amount": 3500000,
  "currency": "COP",
  "reference": "REF-1234567890",
  "wompiTransactionId": "wompi-txn-abc123",
  "message": "Transaction is still pending"
}
```

> 🔁 **Acción:** Espera 5 segundos y vuelve a consultar.

#### Caso 2: APPROVED (Exitosa)

```json
{
  "transactionId": "uuid-transaction-id",
  "status": "APPROVED",
  "amount": 3500000,
  "currency": "COP",
  "reference": "REF-1234567890",
  "wompiTransactionId": "wompi-txn-abc123",
  "message": "Transaction approved successfully"
}
```

> ✅ **¡Éxito!** El pago fue aprobado.

#### Caso 3: DECLINED (Rechazada)

```json
{
  "transactionId": "uuid-transaction-id",
  "status": "DECLINED",
  "amount": 3500000,
  "currency": "COP",
  "reference": "REF-1234567890",
  "wompiTransactionId": "wompi-txn-abc123",
  "message": "Transaction was declined"
}
```

> ❌ El pago fue rechazado por el banco/pasarela.

#### Caso 4: ERROR (Error en procesamiento)

```json
{
  "transactionId": "uuid-transaction-id",
  "status": "ERROR",
  "amount": 3500000,
  "currency": "COP",
  "reference": "REF-1234567890",
  "wompiTransactionId": "wompi-txn-abc123",
  "message": "Transaction failed with error"
}
```

> ⚠️ Hubo un error al procesar el pago.

---

## 🤖 Script de Polling Automatizado

### Bash (Linux/macOS)

Crea un archivo `poll-transaction.sh`:

```bash
#!/bin/bash

TOKEN="$1"
TRANSACTION_ID="$2"
MAX_ATTEMPTS=60  # 5 minutos (60 intentos * 5 segundos)
ATTEMPT=0

if [ -z "$TOKEN" ] || [ -z "$TRANSACTION_ID" ]; then
  echo "Usage: ./poll-transaction.sh <TOKEN> <TRANSACTION_ID>"
  exit 1
fi

echo "🔄 Starting polling for transaction: $TRANSACTION_ID"
echo "⏱️  Will check every 5 seconds for up to 5 minutes..."
echo ""

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))
  echo "📡 Attempt $ATTEMPT/$MAX_ATTEMPTS..."
  
  RESPONSE=$(curl -s -X GET "http://localhost:3000/api/checkout/status/$TRANSACTION_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  STATUS=$(echo $RESPONSE | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  
  echo "   Status: $STATUS"
  
  if [ "$STATUS" = "APPROVED" ]; then
    echo ""
    echo "✅ Transaction APPROVED!"
    echo "$RESPONSE" | jq '.'
    exit 0
  elif [ "$STATUS" = "DECLINED" ]; then
    echo ""
    echo "❌ Transaction DECLINED"
    echo "$RESPONSE" | jq '.'
    exit 1
  elif [ "$STATUS" = "ERROR" ]; then
    echo ""
    echo "⚠️  Transaction ERROR"
    echo "$RESPONSE" | jq '.'
    exit 1
  fi
  
  sleep 5
done

echo ""
echo "⏱️  Timeout: Transaction still PENDING after 5 minutes"
exit 1
```

Usar el script:

```bash
chmod +x poll-transaction.sh
./poll-transaction.sh "TU_TOKEN" "TU_TRANSACTION_ID"
```

### Node.js

Crea un archivo `poll-transaction.js`:

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const MAX_ATTEMPTS = 60; // 5 minutes
const POLL_INTERVAL = 5000; // 5 seconds

async function pollTransactionStatus(token, transactionId) {
  console.log(`🔄 Starting polling for transaction: ${transactionId}`);
  console.log(`⏱️  Will check every 5 seconds for up to 5 minutes...\n`);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`📡 Attempt ${attempt}/${MAX_ATTEMPTS}...`);

    try {
      const response = await axios.get(
        `${BASE_URL}/api/checkout/status/${transactionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { status, message } = response.data;
      console.log(`   Status: ${status}`);

      if (status === 'APPROVED') {
        console.log('\n✅ Transaction APPROVED!');
        console.log(JSON.stringify(response.data, null, 2));
        return response.data;
      } else if (status === 'DECLINED') {
        console.log('\n❌ Transaction DECLINED');
        console.log(JSON.stringify(response.data, null, 2));
        throw new Error('Transaction declined');
      } else if (status === 'ERROR') {
        console.log('\n⚠️  Transaction ERROR');
        console.log(JSON.stringify(response.data, null, 2));
        throw new Error('Transaction error');
      }

      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    } catch (error) {
      if (error.response) {
        console.error('API Error:', error.response.data);
      } else {
        console.error('Error:', error.message);
      }
      throw error;
    }
  }

  console.log('\n⏱️  Timeout: Transaction still PENDING after 5 minutes');
  throw new Error('Polling timeout');
}

// Usage
const [token, transactionId] = process.argv.slice(2);

if (!token || !transactionId) {
  console.error('Usage: node poll-transaction.js <TOKEN> <TRANSACTION_ID>');
  process.exit(1);
}

pollTransactionStatus(token, transactionId)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
```

Usar el script:

```bash
npm install axios  # Si no lo tienes
node poll-transaction.js "TU_TOKEN" "TU_TRANSACTION_ID"
```

---

## 🧪 Testing con Wompi Sandbox

### Tarjetas de Prueba de Wompi

Wompi Sandbox acepta estas tarjetas de prueba:

| Número de Tarjeta    | Resultado Esperado | CVV | Fecha |
|---------------------|-------------------|-----|-------|
| 4242424242424242    | APPROVED          | 123 | Cualquier fecha futura |
| 4000000000000077    | DECLINED          | 123 | Cualquier fecha futura |
| 4000000000000002    | ERROR             | 123 | Cualquier fecha futura |

### Ejemplo: Forzar un DECLINED

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "product-uuid-1", "quantity": 1}],
    "paymentMethod": "CARD",
    "cardNumber": "4000000000000077",
    "cardHolderName": "Test User",
    "cardExpiryMonth": "12",
    "cardExpiryYear": "2025",
    "cardCvv": "123",
    "installments": 1
  }'
```

---

## 🔍 Verificación de Base de Datos

### Ver el Estado de Transacciones

```bash
# Conectarse a PostgreSQL
docker exec -it checkout-postgres psql -U zarco -d checkout

# Consultar transacciones
SELECT id, status, amount, reference, "wompiTransactionId", "createdAt" 
FROM transaction 
ORDER BY "createdAt" DESC 
LIMIT 10;

# Ver productos y stock
SELECT id, name, price, stock 
FROM product 
WHERE "isActive" = true;
```

---

## 📊 Endpoints Disponibles

| Método | Endpoint | Descripción | Requiere Auth | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/auth/register` | Registrar usuario | ❌ | - |
| POST | `/api/auth/login` | Login y obtener JWT | ❌ | - |
| GET | `/api/products` | Listar productos | ✅ | ALL |
| POST | `/api/checkout` | Iniciar checkout | ✅ | CUSTOMER |
| GET | `/api/checkout/status/:id` | Consultar estado | ✅ | CUSTOMER |
| GET | `/api/customer/transactions` | Historial de compras | ✅ | CUSTOMER |
| GET | `/api/admin/transactions/pending` | Transacciones pendientes | ✅ | ADMIN |

---

## 🐛 Troubleshooting

### Error: "Unauthorized"
- Verifica que el token JWT esté incluido en el header `Authorization: Bearer <token>`
- El token puede haber expirado (default: 1 día)

### Error: "Insufficient stock"
- Consulta el endpoint `/api/products` para ver el stock disponible
- Los productos tienen stock limitado por los seeders

### Error: "Transaction not found"
- Verifica que el `transactionId` sea correcto
- Solo puedes consultar tus propias transacciones (no las de otros usuarios)

### Servidor no inicia
```bash
# Verificar que PostgreSQL esté corriendo
docker ps | grep postgres

# Verificar que el puerto 3000 esté libre
lsof -ti:3000 | xargs kill -9

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Notas Importantes

### ⚠️ Comportamiento Asíncrono de Wompi

1. **Todas las transacciones inician en PENDING**: Según la documentación de Wompi, ningún método de pago otorga resultado síncrono.

2. **Polling es necesario**: El cliente debe hacer polling al endpoint `/api/checkout/status/:id` cada 5 segundos hasta obtener un estado final.

3. **Estados finales**: `APPROVED`, `DECLINED`, `ERROR`

4. **Timeout recomendado**: 5 minutos (60 intentos * 5 segundos)

### 🔮 Fulfillment (TODO)

Actualmente, cuando una transacción cambia a `APPROVED`:
- ⚠️ El stock NO se reduce automáticamente
- ⚠️ NO se crea registro de delivery
- ⚠️ NO se envía email de confirmación

> **TODO**: Implementar lógica de fulfillment cuando el status sea APPROVED. Ver comentario en [check-transaction-status.use-case.ts](./src/application/use-cases/checkout/check-transaction-status.use-case.ts)

---

## 🎯 Flow Diagram

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       │ 1. POST /checkout
       │    (items + payment data)
       ▼
┌────────────────────┐
│  Backend NestJS    │
│  ProcessCheckout   │
└─────────┬──────────┘
       │
       │ 2. Crear transacción PENDING
       │    Llamar a Wompi API
       ▼
┌────────────────────┐
│   Wompi Sandbox    │
│   (Async Process)  │
└─────────┬──────────┘
       │
       │ 3. Retorna: status=PENDING
       ▼               wompiTransactionId
┌────────────────────┐
│   Cliente          │
│   Recibe PENDING   │
└─────────┬──────────┘
       │
       │ 4. Loop: Cada 5 segundos
       │    GET /checkout/status/:id
       ▼
┌────────────────────┐
│  Backend NestJS    │
│  CheckStatus       │
└─────────┬──────────┘
       │
       │ 5. Consultar Wompi
       │    GET /transactions/{wompiId}
       ▼
┌────────────────────┐
│   Wompi API        │
│   Status actual    │
└─────────┬──────────┘
       │
       │ 6. APPROVED / DECLINED / ERROR
       ▼
┌────────────────────┐
│   Cliente          │
│   Estado final     │
└────────────────────┘
```

---

## 📚 Referencias

- [Wompi API Documentation](https://docs.wompi.co/)
- [Quick Start Guide](./QUICK_START.md)
- [Authentication Usage](./AUTHENTICATION_USAGE.md)
- [Database Setup](./DATABASE_SETUP.md)
- [Architecture Instructions](./arquitecture.instruction.md)
