/**
 * Transaction status enum
 * Represents the possible states of a payment transaction
 * Aligned with Wompi transaction statuses
 */
export enum TransactionStatus {
  PENDING = 'PENDING', // Transaction created, being processed
  APPROVED = 'APPROVED', // Payment completed successfully
  DECLINED = 'DECLINED', // Payment rejected (insufficient funds, invalid data, etc.)
  VOIDED = 'VOIDED', // Transaction was voided (credit/debit cards only)
  ERROR = 'ERROR', // An error occurred during processing
}
