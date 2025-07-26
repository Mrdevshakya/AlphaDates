import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SubscriptionPlan, CheckoutData, CouponCode } from '../../src/types';
import couponService from '../utils/couponService';
import { SubscriptionService } from '../utils/subscription';

interface CheckoutPageProps {
  visible: boolean;
  onClose: () => void;
  selectedPlan: SubscriptionPlan;
  userId: string;
  onPaymentSuccess: () => void;
}

export default function CheckoutPage({
  visible,
  onClose,
  selectedPlan,
  userId,
  onPaymentSuccess,
}: CheckoutPageProps) {
  const [couponCode, setCouponCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponCode | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    planId: selectedPlan.id,
    originalAmount: selectedPlan.price,
    discountAmount: 0,
    finalAmount: selectedPlan.price,
  });
  const [loading, setLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    // Reset checkout data when plan changes
    setCheckoutData({
      planId: selectedPlan.id,
      originalAmount: selectedPlan.price,
      discountAmount: 0,
      finalAmount: selectedPlan.price,
    });
    setAppliedCoupon(null);
    setCouponCode('');
  }, [selectedPlan]);

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      Alert.alert('Error', 'Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    try {
      console.log('🎫 Validating coupon:', couponCode);
      const result = await couponService.validateCoupon(couponCode.trim(), selectedPlan.id);
      
      if (result.isValid && result.coupon) {
        const discountAmount = couponService.calculateDiscount(
          selectedPlan.price,
          result.coupon.discountPercentage
        );
        
        setAppliedCoupon(result.coupon);
        setCheckoutData({
          planId: selectedPlan.id,
          originalAmount: selectedPlan.price,
          discountAmount,
          finalAmount: selectedPlan.price - discountAmount,
          couponCode: result.coupon.code,
        });

        Alert.alert(
          'Coupon Applied! 🎉',
          `You saved ₹${discountAmount} with ${result.coupon.discountPercentage}% discount!`
        );
      } else {
        Alert.alert('Invalid Coupon', result.error || 'Coupon code is not valid');
        removeCoupon();
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      Alert.alert('Error', 'Failed to validate coupon code');
      removeCoupon();
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCheckoutData({
      planId: selectedPlan.id,
      originalAmount: selectedPlan.price,
      discountAmount: 0,
      finalAmount: selectedPlan.price,
    });
  };

  const validateUPI = (upi: string): boolean => {
    // Basic UPI ID validation
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    return upiRegex.test(upi);
  };

  const processPayment = async () => {
    if (!upiId.trim()) {
      Alert.alert('Error', 'Please enter your UPI ID');
      return;
    }

    if (!validateUPI(upiId.trim())) {
      Alert.alert('Error', 'Please enter a valid UPI ID (e.g., user@paytm)');
      return;
    }

    setPaymentProcessing(true);
    try {
      console.log('💳 Processing payment for checkout:', checkoutData);
      
      // Create enhanced payment order
      const orderData = {
        userId,
        planId: selectedPlan.id,
        amount: checkoutData.finalAmount,
        originalAmount: checkoutData.originalAmount,
        discountAmount: checkoutData.discountAmount,
        couponCode: appliedCoupon?.code,
        upiId: upiId.trim(),
      };

      // Create payment order
      const order = await SubscriptionService.createEnhancedPaymentOrder(orderData);
      console.log('📋 Payment order created:', order.id);

      // Apply coupon if used
      if (appliedCoupon && checkoutData.discountAmount > 0) {
        await couponService.applyCoupon(
          appliedCoupon.id,
          userId,
          order.id,
          checkoutData.discountAmount
        );
        console.log('🎫 Coupon applied to order');
      }

      // Simulate UPI payment process
      Alert.alert(
        'Payment Initiated 💳',
        `Payment request sent to ${upiId}\nAmount: ₹${checkoutData.finalAmount}\n\nPlease complete the payment in your UPI app.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setPaymentProcessing(false),
          },
          {
            text: 'Payment Completed',
            onPress: () => handlePaymentSuccess(order.id),
          },
        ]
      );
    } catch (error) {
      console.error('❌ Payment processing error:', error);
      Alert.alert('Payment Failed', 'Failed to process payment. Please try again.');
      setPaymentProcessing(false);
    }
  };

  const handlePaymentSuccess = async (orderId: string) => {
    try {
      console.log('✅ Processing payment success for order:', orderId);
      
      // Activate subscription
      await SubscriptionService.activateSubscription(userId, selectedPlan.id, orderId);
      console.log('🎉 Subscription activated successfully');

      Alert.alert(
        'Payment Successful! 🎉',
        `Your ${selectedPlan.name} subscription has been activated!\n\nYou can now access all premium features.`,
        [
          {
            text: 'Continue',
            onPress: () => {
              onPaymentSuccess();
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error activating subscription:', error);
      Alert.alert('Error', 'Payment successful but failed to activate subscription. Please contact support.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Plan Summary */}
          <View style={styles.planSummary}>
            <Text style={styles.sectionTitle}>Selected Plan</Text>
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{selectedPlan.name}</Text>
                {selectedPlan.isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>POPULAR</Text>
                  </View>
                )}
              </View>
              <Text style={styles.planDuration}>{selectedPlan.duration} month{selectedPlan.duration > 1 ? 's' : ''}</Text>
              <View style={styles.featuresContainer}>
                {selectedPlan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Coupon Code Section */}
          <View style={styles.couponSection}>
            <Text style={styles.sectionTitle}>Coupon Code</Text>
            <View style={styles.couponInputContainer}>
              <TextInput
                style={[styles.couponInput, appliedCoupon && styles.couponInputSuccess]}
                placeholder="Enter coupon code (e.g., AMITY2025)"
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
                editable={!appliedCoupon}
              />
              {appliedCoupon ? (
                <TouchableOpacity onPress={removeCoupon} style={styles.removeCouponButton}>
                  <Ionicons name="close-circle" size={24} color="#FF4B6A" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={validateCoupon}
                  style={styles.applyCouponButton}
                  disabled={couponLoading}
                >
                  {couponLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.applyCouponText}>Apply</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
            {appliedCoupon && (
              <View style={styles.couponSuccess}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.couponSuccessText}>
                  {appliedCoupon.discountPercentage}% discount applied!
                </Text>
              </View>
            )}
          </View>

          {/* Price Breakdown */}
          <View style={styles.priceBreakdown}>
            <Text style={styles.sectionTitle}>Price Details</Text>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Plan Price</Text>
              <Text style={styles.priceValue}>{formatCurrency(checkoutData.originalAmount)}</Text>
            </View>
            {checkoutData.discountAmount > 0 && (
              <View style={styles.priceItem}>
                <Text style={[styles.priceLabel, styles.discountLabel]}>
                  Discount ({appliedCoupon?.discountPercentage}%)
                </Text>
                <Text style={[styles.priceValue, styles.discountValue]}>
                  -{formatCurrency(checkoutData.discountAmount)}
                </Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.priceItem}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>{formatCurrency(checkoutData.finalAmount)}</Text>
            </View>
            {checkoutData.discountAmount > 0 && (
              <Text style={styles.savingsText}>
                You save {formatCurrency(checkoutData.discountAmount)}! 🎉
              </Text>
            )}
          </View>

          {/* UPI Payment Section */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <View style={styles.upiContainer}>
              <Text style={styles.upiLabel}>UPI ID</Text>
              <TextInput
                style={styles.upiInput}
                placeholder="Enter your UPI ID (e.g., user@paytm)"
                value={upiId}
                onChangeText={setUpiId}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.upiHint}>
                Enter your UPI ID to receive payment request
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Payment Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={processPayment}
            style={[styles.payButton, paymentProcessing && styles.payButtonDisabled]}
            disabled={paymentProcessing}
          >
            <LinearGradient
              colors={paymentProcessing ? ['#ccc', '#999'] : ['#FF4B6A', '#FF6B8A']}
              style={styles.payButtonGradient}
            >
              {paymentProcessing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="card" size={20} color="#FFF" />
                  <Text style={styles.payButtonText}>
                    Pay {formatCurrency(checkoutData.finalAmount)}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 20,
  },
  planSummary: {
    marginTop: 10,
  },
  planCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  popularBadge: {
    backgroundColor: '#FF4B6A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planDuration: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  featuresContainer: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
  },
  couponSection: {
    marginTop: 10,
  },
  couponInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
  },
  couponInputSuccess: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  applyCouponButton: {
    backgroundColor: '#FF4B6A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  applyCouponText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  removeCouponButton: {
    padding: 8,
  },
  couponSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  couponSuccessText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  priceBreakdown: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  priceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  discountLabel: {
    color: '#4CAF50',
  },
  discountValue: {
    color: '#4CAF50',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF4B6A',
  },
  savingsText: {
    textAlign: 'center',
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 8,
    fontSize: 14,
  },
  paymentSection: {
    marginTop: 10,
  },
  upiContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  upiLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  upiInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
    marginBottom: 8,
  },
  upiHint: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  payButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});