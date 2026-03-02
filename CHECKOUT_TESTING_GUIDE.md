# Guía de Pruebas del Checkout (Flujo Completo)

## 📋 Resumen

Esta guía te ayudará a probar el flujo completo de checkout con la integración de Wompi en modo **asíncrono**, incluyendo el proceso de fulfillment (reducción de stock, creación de delivery, y logging de auditoría).

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
    "email": "johndoe@test.com",
    "password": "Test123!pass",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Respuesta esperada:**
```json
{
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "johndoe@test.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

> ⚠️ **Importante:** 
> - La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número
> - Guarda el `accessToken` para los siguientes pasos

### Opción B: Login con Usuario Existente

Si ya tienes una cuenta:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "johndoe@test.com",
    "password": "Test123!pass"
  }'
```

**Respuesta esperada:**
```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "email": "johndoe@test.com",
      "roles": ["CUSTOMER"]
    }
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
  "statusCode": 200,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": "product-uuid-1",
      "name": "Laptop Dell XPS 13",
      "description": "High-performance laptop with Intel Core i7, 16GB RAM, 512GB SSD",
      "price": 1299.99,
      "stock": 10,
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    },
    {
      "id": "product-uuid-2",
      "name": "iPhone 15 Pro",
      "description": "Latest Apple iPhone with A17 Pro chip, 256GB storage",
      "price": 999.99,
      "stock": 25,
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    },
    {
      "id": "product-uuid-3",
      "name": "Samsung Galaxy S24",
      "description": "Flagship Android phone with 128GB storage and 5G connectivity",
      "price": 799.99,
      "stock": 15,
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

> 📝 **Nota:** El seeder crea 10 productos diferentes. Copia el `id` del producto que quieras comprar.

### Productos Disponibles (Seeder)

Los siguientes productos están disponibles después de ejecutar `npm run seed:run`:

| Producto | Precio (USD) | Stock | Descripción |
|----------|--------------|-------|-------------|
| Laptop Dell XPS 13 | $1,299.99 | 10 | Intel i7, 16GB RAM, 512GB SSD |
| iPhone 15 Pro | $999.99 | 25 | A17 Pro chip, 256GB |
| Samsung Galaxy S24 | $799.99 | 15 | 128GB, 5G |
| Sony WH-1000XM5 Headphones | $399.99 | 30 | Noise-canceling wireless |
| iPad Pro 12.9" | $1,099.99 | 20 | M2 chip, 256GB |
| MacBook Pro 14" | $1,999.99 | 8 | M3 Pro chip, 18GB RAM |
| Apple Watch Series 9 | $399.99 | 40 | GPS, health monitoring |
| Samsung 55" 4K Smart TV | $549.99 | 12 | Crystal UHD 4K |
| Nintendo Switch OLED | $349.99 | 18 | OLED screen, 64GB |
| Logitech MX Master 3S | $99.99 | 50 | Ergonomic wireless mouse |

---

## 💳 Paso 3: Procesar Checkout (Retorna PENDING)

### Estructura del Payload

El endpoint `/api/checkout` requiere:
- **items**: Array de productos con `productId` y `quantity`
- **paymentMethod**: Objeto con tipo y datos específicos del método de pago
- **shippingAddress**: Dirección completa de entrega
- **customerEmail**: Email del cliente (para notificaciones)

### Ejemplo 1: Pago con Tarjeta (CARD)

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "REEMPLAZA_CON_ID_REAL",
        "quantity": 2
      }
    ],
    "paymentMethod": {
      "type": "CARD",
      "token": "tok_sandbox_card_visa_4242",
      "installments": 1
    },
    "shippingAddress": {
      "addressLine1": "Calle 123 #45-67",
      "addressLine2": "Apartamento 302",
      "city": "Bogotá",
      "region": "Cundinamarca",
      "country": "Colombia",
      "postalCode": "110111",
      "recipientName": "John Doe",
      "recipientPhone": "+57 300 123 4567"
    },
    "customerEmail": "johndoe@test.com"
  }'
```

### Ejemplo 2: Pago con Nequi

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "REEMPLAZA_CON_ID_REAL",
        "quantity": 1
      }
    ],
    "paymentMethod": {
      "type": "NEQUI",
      "phoneNumber": "3001234567"
    },
    "shippingAddress": {
      "addressLine1": "Carrera 7 #123-45",
      "city": "Medellín",
      "region": "Antioquia",
      "country": "Colombia",
      "postalCode": "050001",
      "recipientName": "Jane Smith",
      "recipientPhone": "+57 310 987 6543"
    },
    "customerEmail": "janesmith@test.com"
  }'
```

### Ejemplo 3: Pago con PSE

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "REEMPLAZA_CON_ID_REAL",
        "quantity": 1
      }
    ],
    "paymentMethod": {
      "type": "PSE",
      "userType": "NATURAL",
      "financialInstitutionCode": "1001"
    },
    "shippingAddress": {
      "addressLine1": "Avenida 68 #123-45",
      "city": "Cali",
      "region": "Valle del Cauca",
      "country": "Colombia",
      "postalCode": "760001",
      "recipientName": "Carlos López",
      "recipientPhone": "+57 320 456 7890"
    },
    "customerEmail": "carlos@test.com"
  }'
```

### Respuesta Esperada (PENDING)

```json
{
  "statusCode": 201,
  "message": "Checkout processed successfully",
  "data": {
    "transactionId": "uuid-transaction-id",
    "transactionNumber": "TXN-2026-001",
    "wompiTransactionId": "wompi-txn-abc123",
    "status": "PENDING",
    "amount": 2599.98,
    "currency": "USD",
    "reference": "REF-1234567890",
    "paymentMethod": "CARD",
    "redirectUrl": null
  }
}
```

> ⚠️ **IMPORTANTE:** 
> - La respuesta retorna `status: "PENDING"` porque Wompi procesa pagos de forma **asíncrona**
> - Debes guardar el `transactionId` para hacer polling
> - En este punto:
>   - ✅ Transaction creada en base de datos
>   - ✅ TransactionItems guardados (snapshot de productos y precios)
>   - ❌ Stock **NO** se ha reducido aún
>   - ❌ Delivery **NO** se ha creado aún
> - El fulfillment ocurre cuando el status cambia a APPROVED

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
  "statusCode": 200,
  "message": "Transaction status retrieved",
  "data": {
    "transactionId": "uuid-transaction-id",
    "transactionNumber": "TXN-2026-001",
    "status": "PENDING",
    "amount": 2599.98,
    "currency": "USD",
    "reference": "REF-1234567890",
    "wompiTransactionId": "wompi-txn-abc123",
    "statusChanged": false
  }
}
```

> 🔁 **Acción:** Espera 5 segundos y vuelve a consultar.

#### Caso 2: APPROVED (Exitosa - Con Fulfillment)

```json
{
  "statusCode": 200,
  "message": "Transaction status retrieved",
  "data": {
    "transactionId": "uuid-transaction-id",
    "transactionNumber": "TXN-2026-001",
    "status": "APPROVED",
    "amount": 2599.98,
    "currency": "USD",
    "reference": "REF-1234567890",
    "wompiTransactionId": "wompi-txn-abc123",
    "statusChanged": true,
    "deliveryId": "delivery-uuid-123"
  }
}
```

> ✅ **¡Éxito!** El pago fue aprobado y el fulfillment se ejecutó automáticamente:
> - ✅ **Stock reducido**: Los productos comprados se restaron del inventario
> - ✅ **Delivery creado**: Se creó un registro de entrega con ID `deliveryId`
> - ✅ **Audit logs**: Se registraron 4 acciones en audit_logs:
>   - `FULFILLMENT_APPROVED_START`: Inicio del proceso
>   - `FULFILLMENT_STOCK_REDUCED`: Stock actualizado
>   - `FULFILLMENT_DELIVERY_CREATED`: Delivery creado
>   - `FULFILLMENT_APPROVED_SUCCESS`: Proceso completado
> - 📧 **Email**: TODO - Se enviará confirmación al cliente

#### Caso 3: DECLINED (Rechazada)

```json
{
  "statusCode": 200,
  "message": "Transaction status retrieved",
  "data": {
    "transactionId": "uuid-transaction-id",
    "transactionNumber": "TXN-2026-001",
    "status": "DECLINED",
    "amount": 2599.98,
    "currency": "USD",
    "reference": "REF-1234567890",
    "wompiTransactionId": "wompi-txn-abc123",
    "statusChanged": true,
    "errorCode": "INSUFFICIENT_FUNDS",
    "errorMessage": "The payment was declined by the bank"
  }
}
```

> ❌ El pago fue rechazado por el banco/pasarela:
> - ❌ **Stock NO reducido**: El inventario permanece intacto
> - ❌ **Delivery NO creado**: No se crea registro de entrega
> - ✅ **Audit log**: Se registró `FULFILLMENT_DECLINED_PROCESSED` con el motivo
> - 📧 **Email**: TODO - Se notificará al cliente del rechazo

#### Caso 4: ERROR (Error en procesamiento)

```json
{
  "statusCode": 200,
  "message": "Transaction status retrieved",
  "data": {
    "transactionId": "uuid-transaction-id",
    "transactionNumber": "TXN-2026-001",
    "status": "ERROR",
    "amount": 2599.98,
    "currency": "USD",
    "reference": "REF-1234567890",
    "wompiTransactionId": "wompi-txn-abc123",
    "statusChanged": true,
    "errorCode": "GATEWAY_ERROR",
    "errorMessage": "An error occurred while processing the payment"
  }
}
```

> ⚠️ Hubo un error al procesar el pago:
> - ❌ **Stock NO reducido**: El inventario permanece intacto
> - ❌ **Delivery NO creado**: No se crea registro de entrega
> - ✅ **Audit log**: Se registró `FULFILLMENT_ERROR_LOGGED` con detalles del error
> - 🚨 **Admin alert**: TODO - Se alertará a los administradores

---

## 🔍 Verificar Fulfillment en Base de Datos

Después de que una transacción sea APPROVED, puedes verificar que el fulfillment se ejecutó correctamente:

### 1. Verificar Reducción de Stock

```bash
# Conectarse a PostgreSQL
docker exec -it checkout-postgres psql -U zarco -d checkout

# Ver stock actual del producto
SELECT id, name, stock 
FROM product 
WHERE id = 'PRODUCT_ID_AQUI';
```

El stock debe haber disminuido según la cantidad comprada.

### 2. Verificar Delivery Creado

```sql
SELECT d.id, d.status, d."customerId", 
       d."shippingAddress", d."trackingNumber",
       d."createdAt"
FROM delivery d
WHERE d."transactionId" = 'TRANSACTION_ID_AQUI';
```

Debe existir un delivery con status `PENDING`.

### 3. Verificar Transaction Items

```sql
SELECT ti.id, ti."productName", ti.quantity, 
       ti."unitPrice", ti.subtotal
FROM transaction_item ti
WHERE ti."transactionId" = 'TRANSACTION_ID_AQUI';
```

Los items deben mostrar el **snapshot** de productos con precios al momento de la compra.

### 4. Verificar Audit Logs del Fulfillment

```sql
SELECT action, metadata, "createdAt"
FROM audit_log
WHERE metadata->>'transactionId' = 'TRANSACTION_ID_AQUI'
AND action LIKE 'FULFILLMENT_%'
ORDER BY "createdAt";
```

Deberías ver los siguientes logs en orden:
1. `FULFILLMENT_APPROVED_START`
2. `FULFILLMENT_STOCK_REDUCED`
3. `FULFILLMENT_DELIVERY_CREATED`
4. `FULFILLMENT_APPROVED_SUCCESS`

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

### ⚠️ Comportamiento Asíncrono de Wompi

1. **Todas las transacciones inician en PENDING**: Según la documentación de Wompi, ningún método de pago otorga resultado síncrono.

2. **Polling es necesario**: El cliente debe hacer polling al endpoint `/api/checkout/status/:id` cada 5 segundos hasta obtener un estado final.

3. **Estados finales**: `APPROVED`, `DECLINED`, `ERROR`

4. **Timeout recomendado**: 5 minutos (60 intentos * 5 segundos)

### ✅ Fulfillment Automático (Implementado)

Cuando una transacción cambia a `APPROVED`, el sistema ejecuta automáticamente el proceso de fulfillment:

#### Proceso de Fulfillment APPROVED:
1. **Obtener Transaction Items**: Se recuperan los items guardados (snapshot de productos)
2. **Reducir Stock**: Para cada item, se reduce el stock del producto correspondiente
3. **Crear Delivery**: Se crea un registro de entrega con:
   - Customer information (nombre, dirección)
   - Shipping address (proporcionada o por defecto del cliente)
   - Status: PENDING
   - Tracking number (auto-generado)
4. **Audit Logging**: Se registran 4 eventos en `audit_logs`:
   - `FULFILLMENT_APPROVED_START`: Inicio del proceso
   - `FULFILLMENT_STOCK_REDUCED`: Stock actualizado para cada producto
   - `FULFILLMENT_DELIVERY_CREATED`: Delivery creado con ID
   - `FULFILLMENT_APPROVED_SUCCESS`: Proceso completado exitosamente
5. **TODO - Email**: Enviar confirmación de orden al cliente

#### Proceso de Fulfillment DECLINED:
1. **Audit Logging**: Se registra `FULFILLMENT_DECLINED_PROCESSED` con:
   - Motivo del rechazo
   - Código de error
   - Detalles de la transacción
2. **TODO - Email**: Notificar al cliente del rechazo

#### Proceso de Fulfillment ERROR:
1. **Audit Logging**: Se registra `FULFILLMENT_ERROR_LOGGED` con:
   - Mensaje y código de error
   - Wompi transaction ID (para debugging)
   - Detalles de la transacción
2. **TODO - Admin Alert**: Enviar alerta a administradores para intervención manual

#### Garantías del Sistema:
- ✅ **Idempotencia**: El fulfillment solo se ejecuta en **transición de estado**, no en cada polling
- ✅ **Atomicidad**: Si falla algún paso, se registra `FULFILLMENT_APPROVED_FAILED` en audit_logs
- ✅ **Trazabilidad**: Todos los eventos se registran en `audit_logs` con metadata completa
- ✅ **Historical Data**: Los `transaction_items` guardan snapshots de productos (precio, nombre al momento de compra)
- ✅ **Resiliencia**: Si el fulfillment falla, el status de la transacción permanece APPROVED para permitir reintentos manuales

#### Ver Documentación Completa:
Para más detalles sobre el proceso de fulfillment, ver [FULFILLMENT.md](./FULFILLMENT.md)

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
