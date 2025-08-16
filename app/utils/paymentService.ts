import { SubscriptionService } from './subscription';
import { CouponService } from './couponService';
import { RazorpayService } from './razorpayService';
import { PaymentOrder, EnhancedPaymentOrder, CouponCode } from '../../src/types';

export class PaymentService {
  // Process payment with Razorpay
  static async processRazorpayPayment(
    userId: string,
    planId: string,
    amount: number,
    couponCode?: string,
    userDetails?: { name: string; email: string; contact: string }
  ): Promise<{ success: boolean; orderId?: string; error?: string; razorpayResponse?: any }> {
    try {
      console.log('💳 PaymentService: Processing Razorpay payment for user:', userId);
      
      // Validate coupon if provided
      let discountAmount = 0;
      let originalAmount = amount;
      let appliedCoupon = null;
      
      if (couponCode) {
        const couponValidation = await CouponService.getInstance().validateCoupon(couponCode, planId);
        if (couponValidation.isValid && couponValidation.coupon) {
          appliedCoupon = couponValidation.coupon;
          discountAmount = CouponService.getInstance().calculateDiscount(amount, appliedCoupon.discountPercentage);
          amount = amount - discountAmount;
        }
      }

      // Create enhanced payment order
      const orderData = {
        userId,
        planId,
        amount,
        originalAmount,
        discountAmount,
        couponCode: appliedCoupon?.code,
      };

      // Create payment order
      const order = await SubscriptionService.createEnhancedPaymentOrder(orderData);
      console.log('📋 PaymentService: Payment order created:', order.id);

      // Apply coupon if used
      if (appliedCoupon && discountAmount > 0) {
        await CouponService.getInstance().applyCoupon(
          appliedCoupon.id,
          userId,
          order.id,
          discountAmount
        );
      }

      // Create Razorpay order
      const razorpayOrder = await RazorpayService.createOrder(
        amount,
        'INR',
        `receipt_${order.id}`
      );

      console.log('✅ PaymentService: Razorpay order created:', razorpayOrder.id);
      
      // Return the order details so the frontend can initiate Razorpay checkout
      return { 
        success: true, 
        orderId: order.id,
        razorpayOrder: razorpayOrder
      };
    } catch (error) {
      console.error('❌ PaymentService: Error processing Razorpay payment:', error);
      return { success: false, error: error.message || 'Failed to process payment' };
    }
  }

  // Handle successful payment
  static async handlePaymentSuccess(orderId: string, paymentId: string): Promise<void> {
    try {
      console.log('🎉 PaymentService: Handling successful payment for order:', orderId);
      
      // Process successful payment through SubscriptionService
      await SubscriptionService.processSuccessfulPayment(orderId, paymentId);
      
      console.log('✅ PaymentService: Payment handled successfully');
    } catch (error) {
      console.error('❌ PaymentService: Error handling payment success:', error);
      throw error;
    }
  }

  // Handle failed payment
  static async handlePaymentFailure(orderId: string, errorMessage?: string): Promise<void> {
    try {
      console.log('❌ PaymentService: Handling failed payment for order:', orderId);
      
      // Update payment order status to failed
      // This would typically involve updating the order in Firestore
      // For now, we'll just log the failure
      
      console.log('✅ PaymentService: Payment failure handled');
    } catch (error) {
      console.error('❌ PaymentService: Error handling payment failure:', error);
      throw error;
    }
  }

  // Get user payment history
  static async getUserPaymentHistory(userId: string): Promise<PaymentOrder[]> {
    try {
      console.log('💳 PaymentService: Fetching payment history for user:', userId);
      
      const history = await SubscriptionService.getUserPaymentHistory(userId);
      
      console.log('✅ PaymentService: Payment history fetched successfully');
      return history;
    } catch (error) {
      console.error('❌ PaymentService: Error fetching payment history:', error);
      return [];
    }
  }

  // Refund payment
  static async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      console.log('💰 PaymentService: Processing refund for payment:', paymentId);
      
      // Process refund through RazorpayService
      const refund = await RazorpayService.refundPayment(paymentId, amount, reason);
      
      console.log('✅ PaymentService: Refund processed successfully');
      // @ts-ignore
      return { success: true, refundId: refund.id };
    } catch (error: any) {
      console.error('❌ PaymentService: Error processing refund:', error);
      return { success: false, error: error.message || 'Failed to process refund' };
    }
  }
}

export default PaymentService;
