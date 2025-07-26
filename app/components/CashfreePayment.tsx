import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { CFPaymentGatewayService } from 'react-native-cashfree-pg-sdk';
import { SubscriptionService } from '../utils/subscription';
import { SubscriptionPlan, PaymentOrder } from '../../src/types';

interface CashfreePaymentProps {
  plan: SubscriptionPlan;
  userId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function CashfreePayment({ plan, userId, onSuccess, onError }: CashfreePaymentProps) {
  const [loading, setLoading] = useState(false);

  const initiateCashfreePayment = async () => {
    try {
      setLoading(true);

      // Create payment order
      const paymentOrder = await SubscriptionService.createPaymentOrder(userId, plan.id);
      
      // Configure payment session
      const sessionData = {
        payment_session_id: paymentOrder.paymentSessionId!,
        order_id: paymentOrder.cashfreeOrderId!,
        environment: __DEV__ ? 'TEST' : 'PROD'
      };

      // Start payment using the available method
      (CFPaymentGatewayService as any).doPayment(
        sessionData,
        (result: any) => {
          console.log('Payment result:', result);
          handlePaymentResult(result, paymentOrder);
        }
      );

    } catch (error) {
      console.error('Payment initiation error:', error);
      setLoading(false);
      onError(error instanceof Error ? error.message : 'Payment failed to start');
    }
  };

  const handlePaymentResult = async (result: any, paymentOrder: PaymentOrder) => {
    try {
      setLoading(false);

      if (result.txStatus === 'SUCCESS') {
        // Process successful payment
        await SubscriptionService.processSuccessfulPayment(
          paymentOrder.id,
          result.referenceId
        );
        
        Alert.alert(
          'Payment Successful! 🎉',
          `Your ${plan.name} subscription is now active!`,
          [{ text: 'OK', onPress: onSuccess }]
        );
      } else if (result.txStatus === 'FAILED') {
        onError('Payment failed. Please try again.');
      } else if (result.txStatus === 'CANCELLED') {
        onError('Payment was cancelled.');
      } else {
        onError('Payment status unknown. Please contact support.');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      onError('Failed to process payment. Please contact support.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.payButton, loading && styles.payButtonDisabled]}
        onPress={initiateCashfreePayment}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <>
            <Text style={styles.payButtonText}>Pay ₹{plan.price}</Text>
            <Text style={styles.payButtonSubtext}>Secure Payment via Cashfree</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  payButton: {
    backgroundColor: '#FF4B6A',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  payButtonDisabled: {
    backgroundColor: '#999',
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  payButtonSubtext: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
});