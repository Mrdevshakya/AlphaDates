import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import PaymentService from '../utils/paymentService';
import { useAuth } from '../context/AuthContext';
import CustomButton from '../components/CustomButton';
import { RazorpayService } from '../utils/razorpayService';
import Constants from 'expo-constants';

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { planId, planName, planPrice, planDuration } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(parseFloat(planPrice));

  useEffect(() => {
    setFinalAmount(parseFloat(planPrice));
  }, [planPrice]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      Alert.alert('Error', 'Please enter a coupon code');
      return;
    }

    try {
      setLoading(true);
      const couponValidation = await CouponService.validateCoupon(couponCode, planId as string);
      
      if (couponValidation.isValid && couponValidation.coupon) {
        const discount = (parseFloat(planPrice) * couponValidation.coupon.discountPercentage) / 100;
        setAppliedCoupon(couponValidation.coupon);
        setDiscountAmount(discount);
        setFinalAmount(parseFloat(planPrice) - discount);
        Alert.alert('Success', `Coupon applied! You save ₹${discount.toFixed(2)}`);
      } else {
        Alert.alert('Invalid Coupon', couponValidation.error || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      Alert.alert('Error', 'Failed to apply coupon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to continue');
      return;
    }

    try {
      setProcessing(true);
      
      // Get user details for Razorpay
      const userDetails = {
        name: user.displayName || 'User',
        email: user.email || '',
        contact: user.phoneNumber || ''
      };

      // Process payment through PaymentService
      const paymentResult = await PaymentService.processRazorpayPayment(
        user.uid,
        planId as string,
        parseFloat(planPrice),
        appliedCoupon?.code,
        userDetails
      );

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Failed to process payment');
      }

      // Prepare order data for Razorpay checkout
      const orderData = {
        orderId: paymentResult.razorpayOrder.id,
        amount: paymentResult.razorpayOrder.amount,
        currency: paymentResult.razorpayOrder.currency,
        name: 'AlphaDate Premium',
        description: `${planName} Subscription${appliedCoupon?.code ? ` (Coupon: ${appliedCoupon.code})` : ''}`,
        prefill: userDetails,
        theme: {
          color: '#FF4B6A'
        }
      };

      // Check if we're in Expo Go (which doesn't support native modules)
      const isExpoGo = Constants.appOwnership === 'expo';
      
      // Open Razorpay checkout
      let RazorpayCheckout;
      try {
        RazorpayCheckout = (await import('react-native-razorpay')).default;
        // Immediate check after import
        if (!RazorpayCheckout) {
          const errorMessage = isExpoGo 
            ? 'Razorpay payment gateway is not available in Expo Go. Please use Expo Dev Client or build the app with EAS Build to process payments.'
            : 'Razorpay payment gateway is not available. This is likely because react-native-razorpay requires native linking. Please use Expo Dev Client or EAS Build to create a development build.';
          throw new Error(errorMessage);
        }
      } catch (importError) {
        console.error('Failed to import react-native-razorpay:', importError);
        const errorMessage = isExpoGo 
          ? 'Payment gateway not available in Expo Go. Please use Expo Dev Client or build the app with EAS Build to process payments.'
          : 'Payment gateway not available in this environment. Please use Expo Dev Client or build the app to process payments.';
        throw new Error(errorMessage);
      }

      const options = {
        description: orderData.description,
        image: 'https://alphadate.com/logo.png',
        currency: orderData.currency,
        key: 'rzp_live_B8vdXmtPXebXES',
        amount: orderData.amount,
        name: 'AlphaDate',
        order_id: orderData.orderId,
        prefill: orderData.prefill,
        theme: orderData.theme,
      };

      // Final check before using RazorpayCheckout
      if (!RazorpayCheckout) {
        const errorMessage = isExpoGo 
          ? 'Razorpay payment gateway is not available in Expo Go. Please use Expo Dev Client or build the app with EAS Build to process payments.'
          : 'Razorpay payment gateway is not available. This is likely because react-native-razorpay requires native linking. Please use Expo Dev Client or EAS Build to create a development build.';
        throw new Error(errorMessage);
      }

      const razorpayResponse = await RazorpayCheckout.open(options);
      
      // Verify payment signature
      const isValid = RazorpayService.verifyPaymentSignature(
        razorpayResponse.razorpay_order_id,
        razorpayResponse.razorpay_payment_id,
        razorpayResponse.razorpay_signature
      );

      if (!isValid) {
        throw new Error('Payment verification failed');
      }

      // Handle successful payment
      if (paymentResult.orderId) {
        await PaymentService.handlePaymentSuccess(paymentResult.orderId, razorpayResponse.razorpay_payment_id);
      }
      
      // Navigate to success screen
      router.replace({
        pathname: '/payment/success',
        params: { 
          orderId: paymentResult.orderId,
          amount: finalAmount.toString()
        }
      });

    } catch (error: any) {
      console.error('Payment error:', error);
      
      let errorMessage = 'Failed to process payment. Please try again.';
      if (error?.code === 'payment_cancelled') {
        errorMessage = 'Payment was cancelled by user.';
      } else if (error?.code === 'payment_failed') {
        errorMessage = 'Payment failed. Please check your payment details and try again.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Payment Failed', errorMessage);
      
      // Navigate to failure screen only if it's not a cancellation
      if (error?.code !== 'payment_cancelled') {
        router.push({
          pathname: '/payment/failure',
          params: { 
            orderId: '',
            errorMessage: errorMessage
          }
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Checkout</Text>
        <Text style={styles.planName}>{planName}</Text>
        <Text style={styles.planDuration}>{planDuration} month(s)</Text>
      </View>

      <View style={styles.orderSummary}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Plan Price</Text>
          <Text style={styles.priceValue}>₹{parseFloat(planPrice).toFixed(2)}</Text>
        </View>
        
        {discountAmount > 0 && (
          <View style={styles.priceRow}>
            <Text style={styles.discountLabel}>Discount</Text>
            <Text style={styles.discountValue}>-₹{discountAmount.toFixed(2)}</Text>
          </View>
        )}
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{finalAmount.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.couponSection}>
        <Text style={styles.sectionTitle}>Apply Coupon</Text>
        <View style={styles.couponInputContainer}>
          <TextInput
            style={styles.couponInput}
            placeholder="Enter coupon code"
            value={couponCode}
            onChangeText={setCouponCode}
            editable={!loading}
          />
          <CustomButton
            title="Apply"
            onPress={applyCoupon}
            loading={loading}
            style={styles.applyButton}
          />
        </View>
      </View>

      <View style={styles.paymentSection}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <Text style={styles.paymentMethod}>Razorpay (Credit/Debit Card, UPI, Net Banking)</Text>
      </View>

      <View style={styles.buttonContainer}>
        <CustomButton
          title={`Pay ₹${finalAmount.toFixed(2)}`}
          onPress={processPayment}
          loading={processing}
          disabled={processing}
          style={styles.payButton}
        />
        
        <CustomButton
          title="Cancel"
          onPress={() => router.back()}
          variant="outline"
          disabled={processing}
          style={styles.cancelButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#555',
  },
  planDuration: {
    fontSize: 16,
    color: '#888',
    marginTop: 5,
  },
  orderSummary: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    color: '#333',
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  discountLabel: {
    fontSize: 16,
    color: '#666',
  },
  discountValue: {
    fontSize: 16,
    color: '#28a745',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  couponSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  couponInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
  },
  applyButton: {
    minWidth: 80,
  },
  paymentSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  paymentMethod: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  buttonContainer: {
    padding: 20,
  },
  payButton: {
    marginBottom: 15,
  },
  cancelButton: {
    borderColor: '#999',
  },
});
