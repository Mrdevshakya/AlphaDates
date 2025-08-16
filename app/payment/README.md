# Payment Module

This directory contains all payment-related functionality for the AlphaDate application.

## Structure

```
app/payment/
├── _layout.tsx          # Payment stack navigation
├── index.tsx            # Payment plans selection screen
├── checkout.tsx         # Payment processing screen
├── success.tsx          # Payment success confirmation
├── failure.tsx          # Payment failure handling
├── history.tsx          # User payment history
├── constants.ts         # Payment-related constants
├── README.md            # This file
└── index.ts             # Module exports
```

## Components

### Payment Screens

1. **Index Screen** (`index.tsx`)
   - Displays available subscription plans
   - Allows users to select a plan
   - Navigates to checkout screen

2. **Checkout Screen** (`checkout.tsx`)
   - Processes payments via Razorpay
   - Handles coupon code application
   - Manages payment flow and navigation

3. **Success Screen** (`success.tsx`)
   - Confirms successful payments
   - Displays order details
   - Provides navigation options

4. **Failure Screen** (`failure.tsx`)
   - Handles payment failures
   - Provides retry options
   - Shows error information

5. **History Screen** (`history.tsx`)
   - Displays user's payment history
   - Shows transaction details
   - Allows refreshing data

## Services

### PaymentService (`utils/paymentService.ts`)
Central service for handling all payment operations:
- Process Razorpay payments
- Handle payment success/failure
- Manage payment history
- Process refunds

### SubscriptionService (`utils/subscription.ts`)
Handles subscription-related operations:
- Manage subscription plans
- Handle user subscriptions
- Process payment orders
- Activate subscriptions

### CouponService (`utils/couponService.ts`)
Manages coupon functionality:
- Validate coupon codes
- Apply coupons to payments
- Calculate discounts

### RazorpayService (`utils/razorpayService.ts`)
Handles Razorpay integration:
- Create payment orders
- Process payments
- Verify payments
- Handle refunds

## Context

### PaymentContext (`context/PaymentContext.tsx`)
Manages payment state across the application:
- Payment history
- Loading states
- Error handling

## Constants

Defined in `constants.ts`:
- Payment statuses
- Subscription statuses
- Coupon types
- Payment methods
- Currency codes
- Error messages
- Success messages

## Usage

### Processing a Payment

1. User selects a subscription plan on the index screen
2. User is navigated to the checkout screen
3. User can apply a coupon code (optional)
4. Payment is processed via Razorpay
5. User is redirected to success or failure screen based on result

### Viewing Payment History

1. User navigates to the history screen
2. Payment history is loaded from the PaymentContext
3. Transactions are displayed in a list
4. User can refresh the data

## Dependencies

- `react-native-razorpay` for payment processing
- Firebase Firestore for data storage
- Firebase Authentication for user management

## Security

- All payment operations are handled server-side where possible
- Sensitive data is not stored on the client
- Payment verification is performed

## Error Handling

- Comprehensive error handling for all payment operations
- User-friendly error messages
- Graceful degradation when services are unavailable
