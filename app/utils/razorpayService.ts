import RazorpayCheckout from 'react-native-razorpay';

// Add a check to ensure RazorpayCheckout is available
if (!RazorpayCheckout) {
  console.warn('RazorpayCheckout is not available. This is likely because react-native-razorpay requires native linking, which is not supported in Expo Go. Please use Expo Dev Client or EAS Build to create a development build.');
}
import { SubscriptionPlan } from '../../src/types';

// Razorpay configuration - Using the provided test keys
const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_cTXFkZcbQPdB0D';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'qGzx12RbqZRBYdDE1h6ezFMc';

export interface RazorpayOrderData {
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: {
    email: string;
    contact: string;
    name: string;
  };
  theme: {
    color: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export class RazorpayService {
  
  // Create Razorpay order
  static async createOrder(
    amount: number,
    currency: string = 'INR',
    receipt: string
  ): Promise<any> {
    try {
      // In a real app, this should be done on your backend server
      // This is just for demonstration purposes
      const orderData = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency,
        receipt,
        payment_capture: 1,
      };

      // This should be an API call to your backend
      // For now, we'll simulate the order creation
      const order = {
        id: `order_${Date.now()}`,
        entity: 'order',
        amount: orderData.amount,
        amount_paid: 0,
        amount_due: orderData.amount,
        currency: orderData.currency,
        receipt: orderData.receipt,
        status: 'created',
        created_at: Math.floor(Date.now() / 1000),
      };

      return order;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  }

  // Open Razorpay checkout
  static async openCheckout(
    orderData: RazorpayOrderData,
    onSuccess: (response: RazorpayResponse) => void,
    onError: (error: any) => void
  ): Promise<void> {
    try {
      // Check if RazorpayCheckout is available
      if (!RazorpayCheckout) {
        throw new Error('Razorpay SDK not available. This is likely because react-native-razorpay requires native linking, which is not supported in Expo Go. Please use Expo Dev Client or EAS Build to create a development build.');
      }
      
      const options = {
        description: orderData.description,
        image: 'https://alphadate.com/logo.png', // Your app logo
        currency: orderData.currency,
        key: RAZORPAY_KEY_ID,
        amount: orderData.amount,
        name: 'AlphaDate',
        order_id: orderData.orderId,
        prefill: orderData.prefill,
        theme: orderData.theme,
      };

      const data = await RazorpayCheckout.open(options);
      onSuccess(data);
    } catch (error) {
      console.error('Razorpay checkout error:', error);
      onError(error);
    }
  }

  // Verify payment signature (should be done on backend)
  static verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    try {
      // In production, this verification should be done on your backend server
      // using the Razorpay webhook or API
      
      // For now, we'll just return true as a placeholder
      // DO NOT use this in production without proper verification
      console.log('Payment verification:', { orderId, paymentId, signature });
      return true;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }

  // Process subscription payment
  static async processSubscriptionPayment(
    plan: SubscriptionPlan,
    userDetails: {
      name: string;
      email: string;
      contact: string;
    },
    finalAmount: number,
    couponCode?: string
  ): Promise<RazorpayResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        // Create order
        const order = await this.createOrder(
          finalAmount,
          'INR',
          `subscription_${plan.id}_${Date.now()}`
        );

        // Prepare order data for checkout
        const orderData: RazorpayOrderData = {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          name: 'AlphaDate Premium',
          description: `${plan.name} Subscription${couponCode ? ` (Coupon: ${couponCode})` : ''}`,
          prefill: userDetails,
          theme: {
            color: '#FF4B6A',
          },
        };

        // Open Razorpay checkout
        await this.openCheckout(
          orderData,
          (response) => {
            // Verify payment signature
            const isValid = this.verifyPaymentSignature(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            if (isValid) {
              resolve(response);
            } else {
              reject(new Error('Payment verification failed'));
            }
          },
          (error) => {
            reject(error);
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  // Get payment details
  static async getPaymentDetails(paymentId: string): Promise<any> {
    try {
      // In production, this should be an API call to your backend
      // which then calls Razorpay API to get payment details
      
      // For now, return mock data
      return {
        id: paymentId,
        entity: 'payment',
        amount: 0,
        currency: 'INR',
        status: 'captured',
        method: 'upi',
        created_at: Math.floor(Date.now() / 1000),
      };
    } catch (error) {
      console.error('Error fetching payment details:', error);
      throw error;
    }
  }

  // Refund payment
  static async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<any> {
    try {
      // In production, this should be an API call to your backend
      // which then calls Razorpay API to process refund
      
      console.log('Processing refund:', { paymentId, amount, reason });
      
      // For now, return mock refund data
      return {
        id: `rfnd_${Date.now()}`,
        entity: 'refund',
        amount: amount || 0,
        currency: 'INR',
        payment_id: paymentId,
        status: 'processed',
        created_at: Math.floor(Date.now() / 1000),
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }
}

export default RazorpayService;