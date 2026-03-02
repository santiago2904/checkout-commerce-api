# Fulfillment Process Documentation

## Overview

The Fulfillment Service handles the post-payment processing of transactions based on their status from Wompi payment gateway. It orchestrates stock management, delivery creation, and notification logging for approved, declined, and error transactions.

## Architecture

### Components

- **FulfillmentService**: Core service handling transaction fulfillment logic
- **CheckTransactionStatusUseCase**: Integrates with FulfillmentService to trigger fulfillment on status changes
- **TransactionItem Entity**: Stores product snapshots at purchase time for accurate fulfillment
- **Audit System**: Logs all fulfillment actions using the `@Audit` decorator and audit_logs table

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Wompi Payment Gateway                        │
│           (Async - Always returns PENDING initially)             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ├─ Client polls GET /checkout/status/:id
                     │
                     v
        ┌────────────────────────────┐
        │ CheckTransactionStatusUseCase│
        │   - Query Wompi for status  │
        │   - Detect status changes   │
        └────────────┬────────────────┘
                     │
         ┌───────────┴─────────────────────────┐
         │                                     │
         │  Status Changed?                    │
         │  (PENDING → APPROVED/DECLINED/ERROR)│
         └───────────┬─────────────────────────┘
                     │
        ┌────────────┴─────────────┐
        │   FulfillmentService      │
        │  - Process by status      │
        │  - Log to audit_logs      │
        └──────┬──────┬──────┬──────┘
               │      │      │
     ┌─────────┘      │      └─────────┐
     │                │                │
     v                v                v
┌─────────────┐  ┌──────────┐  ┌──────────┐
│  APPROVED   │  │ DECLINED │  │  ERROR   │
│             │  │          │  │          │
│ 1. Get items│  │ Log      │  │ Log error│
│ 2. Reduce   │  │ reason   │  │ details  │
│    stock    │  │          │  │          │
│ 3. Create   │  │ TODO:    │  │ TODO:    │
│    delivery │  │ Email    │  │ Admin    │
│ 4. Log all  │  │ customer │  │ alert    │
│    actions  │  │          │  │          │
│             │  │          │  │          │
│ TODO: Email │  │          │  │          │
│ confirmation│  │          │  │          │
└─────────────┘  └──────────┘  └──────────┘
```

## Transaction Item Snapshots

### Why We Store Items

When a customer completes checkout, we save a **snapshot** of the products they purchased in the `transaction_items` table. This ensures:

1. **Price Integrity**: Product prices may change over time, but the customer paid a specific amount at checkout
2. **Fulfillment Accuracy**: We know exactly which products and quantities to fulfill
3. **Historical Record**: Complete audit trail of what was purchased
4. **Deletion Protection**: Products can be soft-deleted from catalog without losing transaction history

### Schema

```typescript
TransactionItem {
  id: string (UUID)
  transactionId: string (FK to transactions, CASCADE)
  productId: string (FK to products, RESTRICT)
  productName: string (snapshot)
  quantity: number
  unitPrice: Decimal (snapshot)
  subtotal: Decimal (calculated)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Creation Flow

Transaction items are saved **immediately after** transaction creation in `ProcessCheckoutUseCase`:

```typescript
// Step 2: Create transaction
const transaction = await createPendingTransaction(...);

// Step 2.5: Save transaction items (rollback on failure)
const itemsSaveResult = await saveTransactionItems(transaction.id, products);
if (itemsSaveResult.isErr()) {
  // Rollback: Update transaction to ERROR status
  await transactionRepository.updateStatus(
    transaction.id,
    TransactionStatus.ERROR,
    'ITEMS_SAVE_ERROR'
  );
  return err(itemsSaveResult.error);
}

// Step 3: Process payment with Wompi
const paymentResult = await processPayment(...);
```

## Fulfillment by Status

### APPROVED Transactions

**Trigger**: When transaction status changes from PENDING → APPROVED

**Actions**:
1. Log `FULFILLMENT_APPROVED_START` to audit_logs
2. Retrieve transaction items via `transactionItemRepository.findByTransactionId()`
3. For each item:
   - Call `productRepository.updateStock(productId, quantity)` to reduce inventory
   - Log progress
4. Log `FULFILLMENT_STOCK_REDUCED` with item details
5. Create delivery record via `deliveryRepository.create()` with:
   - Customer information from transaction.customer
   - Shipping address (provided or customer default)
   - Status: PENDING
6. Log `FULFILLMENT_DELIVERY_CREATED` with delivery ID
7. Log `FULFILLMENT_APPROVED_SUCCESS` with summary
8. **TODO**: Send order confirmation email to customer

**Error Handling**:
- If fulfillment fails, log `FULFILLMENT_APPROVED_FAILED` with error details
- Transaction status remains APPROVED (allows manual intervention/retry)
- Return error Result for monitoring

**Audit Log Example**:
```json
{
  "userId": "customer-123",
  "action": "FULFILLMENT_APPROVED_SUCCESS",
  "metadata": {
    "transactionId": "trans-456",
    "transactionNumber": "TXN-2024-001",
    "deliveryId": "delivery-789",
    "itemsCount": 3,
    "totalAmount": 150000.00
  }
}
```

### DECLINED Transactions

**Trigger**: When transaction status changes to DECLINED

**Actions**:
1. Log `FULFILLMENT_DECLINED_PROCESSED` to audit_logs with:
   - Transaction details
   - Decline reason (from Wompi)
   - Error code
2. **TODO**: Send payment declined notification email to customer

**Audit Log Example**:
```json
{
  "userId": "customer-123",
  "action": "FULFILLMENT_DECLINED_PROCESSED",
  "metadata": {
    "transactionId": "trans-456",
    "transactionNumber": "TXN-2024-001",
    "amount": 150000.00,
    "declineReason": "Insufficient funds",
    "errorCode": "DECLINED_BY_BANK"
  }
}
```

### ERROR Transactions

**Trigger**: When transaction status changes to ERROR (payment gateway issues)

**Actions**:
1. Log `FULFILLMENT_ERROR_LOGGED` to audit_logs with:
   - Transaction details
   - Error message and code
   - Wompi transaction ID (for debugging)
2. Log error using NestJS Logger (for monitoring/alerting integration)
3. **TODO**: Send alert email to administrators

**Audit Log Example**:
```json
{
  "userId": "customer-123",
  "action": "FULFILLMENT_ERROR_LOGGED",
  "metadata": {
    "transactionId": "trans-456",
    "transactionNumber": "TXN-2024-001",
    "amount": 150000.00,
    "errorMessage": "Gateway timeout",
    "errorCode": "GATEWAY_ERROR",
    "wompiTransactionId": "wompi-789"
  }
}
```

## Audit Actions

All fulfillment actions are logged using predefined constants in `audit-actions.constants.ts`:

```typescript
export const FULFILLMENT_AUDIT_ACTIONS = {
  FULFILLMENT_APPROVED_START: 'FULFILLMENT_APPROVED_START',
  FULFILLMENT_APPROVED_SUCCESS: 'FULFILLMENT_APPROVED_SUCCESS',
  FULFILLMENT_APPROVED_FAILED: 'FULFILLMENT_APPROVED_FAILED',
  FULFILLMENT_DECLINED_PROCESSED: 'FULFILLMENT_DECLINED_PROCESSED',
  FULFILLMENT_ERROR_LOGGED: 'FULFILLMENT_ERROR_LOGGED',
  FULFILLMENT_STOCK_REDUCED: 'FULFILLMENT_STOCK_REDUCED',
  FULFILLMENT_DELIVERY_CREATED: 'FULFILLMENT_DELIVERY_CREATED',
} as const;
```

These actions belong to the `FULFILLMENT` category in audit logs, which includes transaction data for complete traceability.

## Integration Points

### CheckTransactionStatusUseCase

The FulfillmentService is called when the transaction status changes:

```typescript
// Detect status change
if (currentStatus !== newStatus) {
  await transactionRepository.updateStatus(...);
  
  // Get updated transaction with relations
  const updatedTransaction = await transactionRepository.findById(transactionId);
  
  // Process fulfillment based on new status
  if (newStatus === TransactionStatus.APPROVED) {
    await fulfillmentService.processApprovedTransaction(updatedTransaction);
  } else if (newStatus === TransactionStatus.DECLINED) {
    await fulfillmentService.processDeclinedTransaction(updatedTransaction);
  } else if (newStatus === TransactionStatus.ERROR) {
    await fulfillmentService.processErrorTransaction(updatedTransaction);
  }
}
```

**Important**: Fulfillment is triggered **only on state transitions**, not on every polling request. This prevents duplicate processing.

### Dependency Injection

FulfillmentService is registered in `CheckoutModule`:

```typescript
@Module({
  providers: [
    // ... repositories
    FulfillmentService,
    ProcessCheckoutUseCase,
    CheckTransactionStatusUseCase,
  ],
})
export class CheckoutModule {}
```

Dependencies injected:
- `IProductRepository`: For stock updates
- `ITransactionItemRepository`: To retrieve purchased items
- `IDeliveryRepository`: To create delivery records
- `IAuditLogRepository`: For comprehensive audit logging

## Future Enhancements

### Email Notifications (TODO)

Three integration points for email service:

1. **Order Confirmation** (APPROVED):
```typescript
// In processApprovedTransaction()
await this.emailService.sendOrderConfirmation({
  to: transaction.customer.email,
  transactionNumber: transaction.transactionNumber,
  items: items,
  totalAmount: transaction.amount,
  deliveryAddress: address.addressLine1,
  estimatedDelivery: '5-7 business days'
});
```

2. **Payment Declined** (DECLINED):
```typescript
// In processDeclinedTransaction()
await this.emailService.sendPaymentDeclinedNotification({
  to: transaction.customer.email,
  transactionNumber: transaction.transactionNumber,
  amount: transaction.amount,
  declineReason: transaction.errorMessage,
  supportEmail: 'support@yourcompany.com'
});
```

3. **Admin Alert** (ERROR):
```typescript
// In processErrorTransaction()
await this.emailService.sendAdminAlert({
  to: 'admin@yourcompany.com',
  subject: `Transaction Error: ${transaction.transactionNumber}`,
  transactionId: transaction.id,
  errorMessage: transaction.errorMessage,
  timestamp: new Date().toISOString()
});
```

### Webhooks

Instead of polling, Wompi can send webhooks when transaction status changes. This would be more efficient:

1. Create `WebhookController` with POST endpoint
2. Validate webhook signature from Wompi
3. Call `CheckTransactionStatusUseCase` or directly trigger fulfillment
4. Return 200 OK to Wompi

### Retry Mechanisms

For failed fulfillments:
1. Implement exponential backoff retry strategy
2. Use job queue (Bull/BullMQ) for asynchronous processing
3. Add manual retry endpoint for admin intervention

### Inventory Reservations

Currently stock is reduced on APPROVED. Consider:
1. Reserving stock at checkout (optimistic locking)
2. Releasing reservation if payment fails after timeout
3. Prevents overselling during payment processing window

## Testing

### Unit Tests

FulfillmentService has comprehensive unit tests:
- ✅ Process APPROVED transactions with stock reduction + delivery
- ✅ Handle custom shipping addresses
- ✅ Error handling when no items found
- ✅ Error handling when stock update fails
- ✅ Process DECLINED transactions with logging
- ✅ Process ERROR transactions with logging
- ✅ Audit log creation failures

Run tests:
```bash
npm test -- fulfillment.service.spec.ts
```

### Integration Tests

CheckTransactionStatusUseCase tests verify fulfillment integration:
```bash
npm test -- check-transaction-status.use-case.spec.ts
```

### E2E Testing Guide

See [CHECKOUT_TESTING_GUIDE.md](./CHECKOUT_TESTING_GUIDE.md) for end-to-end testing scenarios including:
1. Complete checkout → polling → fulfillment flow
2. Testing with Wompi sandbox
3. Verifying audit logs in database

## Migration

The `transaction_items` table was created with migration:

```bash
# Run migration
npm run migration:run

# Rollback if needed
npm run migration:revert
```

Migration file: `src/infrastructure/adapters/database/typeorm/migrations/1709048000000-CreateTransactionItemsTable.ts`

## Monitoring

### Log Queries

Find all fulfillment logs for a transaction:
```sql
SELECT * FROM audit_logs 
WHERE metadata->>'transactionId' = 'trans-456'
AND action LIKE 'FULFILLMENT_%'
ORDER BY created_at;
```

Find failed fulfillments:
```sql
SELECT * FROM audit_logs 
WHERE action = 'FULFILLMENT_APPROVED_FAILED'
ORDER BY created_at DESC
LIMIT 20;
```

### Metrics to Track

1. **Fulfillment Success Rate**: % of APPROVED transactions successfully fulfilled
2. **Processing Time**: Time from status change to fulfillment completion
3. **Stock Update Failures**: Count of stock reduction errors
4. **Delivery Creation Failures**: Count of delivery record creation errors

## References

- [Architecture Documentation](./src/ARCHITECTURE.md)
- [Checkout Testing Guide](./CHECKOUT_TESTING_GUIDE.md)
- [Authentication Usage](./AUTHENTICATION_USAGE.md)
- [Database Setup](./DATABASE_SETUP.md)
