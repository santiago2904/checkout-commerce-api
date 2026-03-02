# JWT Status Token - Secure Transaction Status Polling

## Overview

The checkout system now uses **JWT (JSON Web Token)** based authentication for transaction status polling. This provides secure access to transaction status without requiring user authentication, while preventing unauthorized access even if the `transactionId` is exposed.

## How It Works

### 1. **Checkout Response Includes Status Token**

When you initiate a checkout (authenticated or guest), the response includes a `statusToken`:

```json
{
  "statusCode": 201,
  "message": "Checkout iniciado exitosamente",
  "data": {
    "transactionId": "550e8400-e29b-41d4-a716-446655440000",
    "wompiTransactionId": "15001-1735685843-04693",
    "status": "PENDING",
    "amount": 50000,
    "currency": "COP",
    "reference": "REF-1735685843-a1b2c3d4",
    "paymentMethod": "CARD",
    "statusToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // ← JWT Token
  }
}
```

### 2. **Token Contains Transaction ID + Email**

The `statusToken` is a JWT that contains:
- `transactionId`: The transaction to check
- `email`: The customer's email (for dual verification)
- `exp`: Expiration timestamp (24 hours from creation)

Example decoded payload:
```json
{
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "customer@example.com",
  "iat": 1735685843,
  "exp": 1735772243
}
```

### 3. **Use Token to Poll Status**

Instead of passing `transactionId` and `email` as query parameters, you now pass the `statusToken`:

**Old Method (Deprecated):**
```bash
GET /api/checkout/status/:transactionId?email=customer@example.com
```

**New Method (Current):**
```bash
GET /api/checkout/status?token={statusToken}
```

## API Endpoints

### Check Transaction Status

**Endpoint:** `GET /api/checkout/status`

**Query Parameters:**
- `token` (required): The JWT status token received from checkout response

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/checkout/status?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0cmFuc2FjdGlvbklkIjoiNTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAwIiwiZW1haWwiOiJjdXN0b21lckBleGFtcGxlLmNvbSIsImlhdCI6MTczNTY4NTg0MywiZXhwIjoxNzM1NzcyMjQzfQ.signature" \
  -H "Accept-Language: es"
```

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Estado de transacción consultado",
  "data": {
    "transactionId": "550e8400-e29b-41d4-a716-446655440000",
    "wompiTransactionId": "15001-1735685843-04693",
    "status": "APPROVED",
    "amount": 50000,
    "reference": "REF-1735685843-a1b2c3d4",
    "paymentMethod": "CARD",
    "redirectUrl": "https://comercio.wompi.sv/return",
    "statusMessage": "Pago aprobado exitosamente"
  }
}
```

**Error Responses:**

**400 Bad Request - Token Required:**
```json
{
  "statusCode": 400,
  "message": "El token de estado es requerido para consultar el estado de la transacción"
}
```

**401 Unauthorized - Invalid/Expired Token:**
```json
{
  "statusCode": 401,
  "message": "Token de estado inválido o expirado. Los tokens expiran en 24 horas"
}
```

**404 Not Found - Transaction Not Found:**
```json
{
  "statusCode": 404,
  "message": "Transacción no encontrada"
}
```

## Complete Checkout Flow Examples

### Authenticated Checkout

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "Password123!"
  }'

# Response includes: { "accessToken": "..." }

# 2. Initiate Checkout
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {accessToken}" \
  -d '{
    "items": [
      {
        "productId": "product-uuid",
        "quantity": 2
      }
    ],
    "paymentMethod": {
      "type": "CARD",
      "token": "tok_test_12345"
    },
    "shippingAddress": {
      "addressLine1": "Calle 123",
      "city": "Bogotá",
      "region": "Cundinamarca",
      "country": "CO",
      "postalCode": "110111",
      "recipientName": "John Doe",
      "recipientPhone": "+573001234567"
    },
    "customerEmail": "customer@example.com",
    "acceptanceToken": "acceptance_token_from_wompi"
  }'

# Response includes: { "statusToken": "eyJhbGci..." }

# 3. Poll Status (use the statusToken from step 2)
curl -X GET "http://localhost:3000/api/checkout/status?token=eyJhbGci..." \
  -H "Accept-Language: es"

# Poll every 5 seconds until status is APPROVED/DECLINED/ERROR
```

### Guest Checkout

```bash
# 1. Initiate Guest Checkout (no authentication required)
curl -X POST http://localhost:3000/api/checkout/guest \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "product-uuid",
        "quantity": 1
      }
    ],
    "paymentMethod": {
      "type": "PSE",
      "userType": "NATURAL",
      "financialInstitutionCode": "1040"
    },
    "shippingAddress": {
      "addressLine1": "Cra 7 #32-16",
      "city": "Bogotá",
      "region": "Cundinamarca",
      "country": "CO",
      "postalCode": "110311",
      "recipientName": "Guest User",
      "recipientPhone": "+573101234567"
    },
    "customerEmail": "guest@example.com",
    "acceptanceToken": "acceptance_token_from_wompi"
  }'

# Response includes: { "statusToken": "eyJhbGci..." }

# 2. Poll Status (use the statusToken from step 1)
curl -X GET "http://localhost:3000/api/checkout/status?token=eyJhbGci..." \
  -H "Accept-Language: es"
```

## Security Features

### 1. **Token Expiration**
- Tokens expire after 24 hours
- Clients must store the token from checkout response
- If token expires, customer must initiate a new checkout

### 2. **Cryptographic Signing**
- Tokens are signed with `JWT_SECRET` from environment
- Cannot be forged or tampered with
- Server validates signature on every request

### 3. **Dual Verification**
- Token contains both `transactionId` AND `email`
- Server validates that the email in token matches transaction
- Even if `transactionId` is leaked, token is still required

### 4. **No Authentication Required**
- Status endpoint is public (no Bearer token needed)
- Customers can check status without logging in
- Token acts as proof of ownership

## Integration Guidelines

### For Frontend Applications

```typescript
// 1. Store statusToken after checkout
const checkoutResponse = await fetch('/api/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`, // Optional for authenticated
  },
  body: JSON.stringify(checkoutRequest)
});

const { data } = await checkoutResponse.json();
const { statusToken, transactionId } = data;

// Store statusToken for later use
localStorage.setItem(`transaction_${transactionId}`, statusToken);

// 2. Poll transaction status
async function checkStatus(statusToken: string) {
  const response = await fetch(`/api/checkout/status?token=${statusToken}`, {
    headers: {
      'Accept-Language': 'es'
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    if (response.status === 401) {
      // Token expired - show message to user
      console.error('Token expired, please initiate a new checkout');
    }
    throw new Error(error.message);
  }
  
  return await response.json();
}

// 3. Poll every 5 seconds until final status
const pollInterval = setInterval(async () => {
  try {
    const { data } = await checkStatus(statusToken);
    
    if (['APPROVED', 'DECLINED', 'ERROR'].includes(data.status)) {
      clearInterval(pollInterval);
      handleFinalStatus(data);
    }
  } catch (error) {
    clearInterval(pollInterval);
    handleError(error);
  }
}, 5000);
```

### For Mobile Applications

```swift
// iOS Example
class CheckoutService {
    func pollTransactionStatus(statusToken: String, completion: @escaping (Result<TransactionStatus, Error>) -> Void) {
        let url = URL(string: "https://api.example.com/api/checkout/status?token=\(statusToken)")!
        
        var request = URLRequest(url: url)
        request.setValue("es", forHTTPHeaderField: "Accept-Language")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let httpResponse = response as? HTTPURLResponse else {
                completion(.failure(NetworkError.invalidResponse))
                return
            }
            
            switch httpResponse.statusCode {
            case 200:
                // Parse and return transaction status
                break
            case 401:
                completion(.failure(TokenError.expired))
            default:
                completion(.failure(NetworkError.serverError))
            }
        }.resume()
    }
}
```

## Migration Guide

### From Old Email-Based Authentication

**Old Code:**
```javascript
// ❌ Old method (deprecated)
const response = await fetch(
  `/api/checkout/status/${transactionId}?email=${email}`
);
```

**New Code:**
```javascript
// ✅ New method (current)
const response = await fetch(
  `/api/checkout/status?token=${statusToken}`
);
```

### Database Migration

Run the migration to add `statusToken` column:

```bash
npm run typeorm migration:run
```

This adds the `statusToken` column to the `transactions` table:

```sql
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "statusToken" text;
```

To rollback:

```bash
npm run typeorm migration:revert
```

## Environment Configuration

Ensure `JWT_SECRET` is configured in your `.env`:

```env
JWT_SECRET=your-secret-key-here  # Must be at least 32 characters
```

The same secret is used for both authentication tokens and status tokens.

## Monitoring and Debugging

### Decode Token (for debugging)

You can decode the JWT token using [jwt.io](https://jwt.io):

1. Copy the `statusToken` value
2. Paste into jwt.io decoder
3. Verify payload contains `transactionId` and `email`
4. Check `exp` timestamp (should be 24h from `iat`)

### Common Issues

**Issue:** "Token de estado inválido o expirado"
- **Cause:** Token is older than 24 hours
- **Solution:** Initiate a new checkout to get a fresh token

**Issue:** "Token does not match transaction"
- **Cause:** Email in token doesn't match transaction email
- **Solution:** This indicates a security issue - investigate immediately

**Issue:** "El token de estado es requerido"
- **Cause:** Missing `token` query parameter
- **Solution:** Ensure you're passing `?token=...` in the URL

## Best Practices

1. **Store Tokens Securely**
   - Use secure storage (e.g., encrypted local storage, keychain)
   - Don't log tokens in production
   - Clear tokens after transaction is complete

2. **Handle Expiration Gracefully**
   - Show user-friendly message when token expires
   - Provide option to view transaction history (requires authentication)

3. **Poll Responsibly**
   - Poll every 5 seconds (not more frequently)
   - Stop polling after receiving final status
   - Implement exponential backoff if needed

4. **Error Handling**
   - Handle 401 (expired token) separately from other errors
   - Show appropriate UI feedback for each error type
   - Log errors for debugging

## Support

For issues or questions:
- Check the [Checkout Testing Guide](./CHECKOUT_TESTING_GUIDE.md)
- Review the [Quick Start Guide](./QUICK_START.md)
- Open an issue on GitHub
