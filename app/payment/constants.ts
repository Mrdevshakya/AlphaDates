// Payment module constants

// Payment statuses
export const PAYMENT_STATUS = {
  CREATED: 'created',
  SUCCESS: 'success',
  FAILED: 'failed',
  PENDING: 'pending',
  REFUNDED: 'refunded',
} as const;

// Subscription statuses
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

// Coupon types
export const COUPON_TYPE = {
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
} as const;

// Payment methods
export const PAYMENT_METHOD = {
  RAZORPAY: 'razorpay',
  UPI: 'upi',
  CARD: 'card',
  WALLET: 'wallet',
} as const;

// Currency codes
export const CURRENCY = {
  INR: 'INR',
  USD: 'USD',
  EUR: 'EUR',
} as const;

// Default values
export const DEFAULT_CURRENCY = CURRENCY.INR;
export const DEFAULT_PAYMENT_METHOD = PAYMENT_METHOD.RAZORPAY;

// Error messages
export const PAYMENT_ERRORS = {
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  PAYMENT_CANCELLED: 'Payment was cancelled by user.',
  INVALID_COUPON: 'Invalid coupon code.',
  COUPON_EXPIRED: 'Coupon code has expired.',
  COUPON_LIMIT_EXCEEDED: 'Coupon usage limit exceeded.',
  INSUFFICIENT_FUNDS: 'Insufficient funds.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
} as const;

// Success messages
export const PAYMENT_SUCCESS = {
  PAYMENT_COMPLETED: 'Payment completed successfully!',
  SUBSCRIPTION_ACTIVATED: 'Your subscription has been activated.',
  COUPON_APPLIED: 'Coupon applied successfully!',
} as const;

// Export all constants as default
export default {
  PAYMENT_STATUS,
  SUBSCRIPTION_STATUS,
  COUPON_TYPE,
  PAYMENT_METHOD,
  CURRENCY,
  DEFAULT_CURRENCY,
  DEFAULT_PAYMENT_METHOD,
  PAYMENT_ERRORS,
  PAYMENT_SUCCESS
};
