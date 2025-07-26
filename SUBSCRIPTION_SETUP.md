# Subscription System Setup Guide

This guide explains how to set up and configure the subscription system with Cashfree payment gateway integration.

## Features Implemented

✅ **Subscription Data Models**: Complete TypeScript types for subscriptions, payment orders, and plans
✅ **Cashfree Integration**: Payment gateway service with order creation and processing
✅ **Subscription Service**: Complete service layer for managing subscriptions
✅ **UI Components**: Subscription plans modal and payment interface
✅ **Auth Context Integration**: Subscription status tracking in user context
✅ **Matches Protection**: Matches feature now requires active subscription

## Subscription Plans

The following subscription plans are configured:

1. **1 Month** - ₹100
   - Unlimited matches
   - See who liked you
   - Priority support

2. **3 Months** - ₹300 (Most Popular)
   - All 1-month features
   - Boost profile

3. **6 Months** - ₹450
   - All 3-month features
   - Super likes

4. **12 Months** - ₹1000
   - All 6-month features
   - Read receipts

## Setup Instructions

### 1. Cashfree Account Setup

1. Create a Cashfree account at [https://www.cashfree.com/](https://www.cashfree.com/)
2. Get your App ID and Secret Key from the dashboard
3. Configure webhook URLs for payment notifications

### 2. Environment Configuration

1. Update the `.env` file with your Cashfree credentials:
```env
EXPO_PUBLIC_CASHFREE_APP_ID=your_actual_app_id
EXPO_PUBLIC_CASHFREE_SECRET_KEY=your_actual_secret_key
```

### 3. Firebase Firestore Setup

Create the following collections in your Firestore database:

#### `subscriptions` Collection
```javascript
{
  id: string,
  userId: string,
  planId: string,
  status: 'active' | 'expired' | 'cancelled' | 'pending',
  startDate: Date,
  endDate: Date,
  paymentId?: string,
  orderId?: string,
  createdAt: Date,
  updatedAt: Date
}
```

#### `paymentOrders` Collection
```javascript
{
  id: string,
  userId: string,
  planId: string,
  amount: number,
  currency: string,
  status: 'created' | 'paid' | 'failed' | 'cancelled',
  cashfreeOrderId?: string,
  paymentSessionId?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Firestore Security Rules

Add these rules to your `firestore.rules`:

```javascript
// Subscriptions
match /subscriptions/{subscriptionId} {
  allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
}

// Payment Orders
match /paymentOrders/{orderId} {
  allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
}
```

### 5. Webhook Configuration

Set up webhooks in your Cashfree dashboard to handle payment notifications:

- **Webhook URL**: `https://your-backend-url.com/webhooks/cashfree`
- **Events**: `ORDER_PAID`, `PAYMENT_SUCCESS`, `PAYMENT_FAILED`

## Usage

### For Users Without Subscription

1. When users try to access matches, they'll see a subscription required screen
2. Users can tap "Get Premium" to view subscription plans
3. After selecting a plan, they'll be redirected to Cashfree payment gateway
4. Upon successful payment, subscription is activated automatically

### For Users With Active Subscription

1. Users can access all matches features normally
2. Subscription status is checked in real-time
3. Users can manage their subscription from the plans modal

## Testing

### Test Mode Setup

1. Use Cashfree TEST environment credentials in development
2. Use test payment methods provided by Cashfree
3. Test different payment scenarios (success, failure, cancellation)

### Test Payment Cards

Cashfree provides test cards for different scenarios:
- **Success**: 4111 1111 1111 1111
- **Failure**: 4012 0010 3714 1112
- **Insufficient Funds**: 4000 0000 0000 0002

## Security Considerations

1. **Environment Variables**: Never commit actual credentials to version control
2. **Server-Side Validation**: Implement server-side payment verification
3. **Webhook Security**: Verify webhook signatures from Cashfree
4. **User Authentication**: Ensure only authenticated users can make payments

## Troubleshooting

### Common Issues

1. **Payment Gateway Not Loading**
   - Check Cashfree credentials
   - Verify environment configuration
   - Check network connectivity

2. **Subscription Not Activating**
   - Verify webhook configuration
   - Check Firestore permissions
   - Review payment processing logs

3. **TypeScript Errors**
   - Ensure all types are properly imported
   - Check Firebase configuration
   - Verify Cashfree SDK installation

### Debug Mode

Enable debug logging by adding this to your app:

```javascript
// In your main app file
if (__DEV__) {
  console.log('Subscription Debug Mode Enabled');
}
```

## Support

For issues related to:
- **Cashfree Integration**: Contact Cashfree support
- **Firebase Issues**: Check Firebase documentation
- **App-specific Issues**: Review the implementation code

## Next Steps

1. **Analytics**: Add subscription analytics tracking
2. **Push Notifications**: Notify users about subscription expiry
3. **Promotional Offers**: Implement discount codes
4. **Family Plans**: Add shared subscription options
5. **Auto-renewal**: Implement subscription auto-renewal