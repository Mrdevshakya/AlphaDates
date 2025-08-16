import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { SubscriptionPlan, UserSubscription, PaymentOrder, EnhancedPaymentOrder, UPIPayment } from '../../src/types';

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: '1 Month',
    duration: 1,
    price: 100,
    features: ['Unlimited matches', 'See who liked you', 'Priority support'],
    isPopular: false
  },
  {
    id: 'quarterly',
    name: '3 Months',
    duration: 3,
    price: 300,
    features: ['Unlimited matches', 'See who liked you', 'Priority support', 'Boost profile'],
    isPopular: true
  },
  {
    id: 'halfyearly',
    name: '6 Months',
    duration: 6,
    price: 450,
    features: ['Unlimited matches', 'See who liked you', 'Priority support', 'Boost profile', 'Super likes'],
    isPopular: false
  },
  {
    id: 'yearly',
    name: '12 Months',
    duration: 12,
    price: 1000,
    features: ['Unlimited matches', 'See who liked you', 'Priority support', 'Boost profile', 'Super likes', 'Read receipts'],
    isPopular: false
  }
];


export class SubscriptionService {
  
  // Get subscription plans
  static getSubscriptionPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS;
  }

  // Get user's current subscription
  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      console.log('🔍 SubscriptionService: Fetching subscription for user:', userId);
      const subscriptionsRef = collection(db, 'subscriptions');
      
      // First query by userId only to avoid index requirement
      const q = query(
        subscriptionsRef,
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      console.log('📊 SubscriptionService: Found subscriptions:', snapshot.size);
      
      if (snapshot.empty) {
        console.log('❌ SubscriptionService: No subscriptions found');
        return null;
      }
      
      // Filter active subscriptions client-side and get the most recent
      const activeSubscriptions = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as UserSubscription))
        .filter(sub => sub.status === 'active')
        .sort((a, b) => {
          // Handle Firestore timestamp conversion for sorting
          const getTime = (date: any) => {
            if (date && typeof date === 'object' && 'seconds' in date) {
              return date.seconds * 1000;
            } else if (date instanceof Date) {
              return date.getTime();
            } else if (typeof date === 'string') {
              return new Date(date).getTime();
            }
            return 0;
          };
          return getTime(b.createdAt) - getTime(a.createdAt);
        });
      
      if (activeSubscriptions.length === 0) {
        console.log('❌ SubscriptionService: No active subscriptions found');
        return null;
      }
      
      const subscription = activeSubscriptions[0];
      console.log('✅ SubscriptionService: Found subscription:', subscription);
      return subscription;
    } catch (error) {
      console.error('❌ SubscriptionService: Error fetching user subscription:', error);
      return null;
    }
  }

  // Check if user has active subscription
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      console.log('🔍 SubscriptionService: hasActiveSubscription called for user:', userId);
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        console.log('❌ SubscriptionService: No subscription found in hasActiveSubscription, returning false');
        return false;
      }
      
      const now = new Date();
      console.log('📅 SubscriptionService: Current timestamp (now):', now.getTime(), 'Date:', now.toISOString());
      
      // Handle Firestore timestamp conversion
      let endDate: Date;
      if (subscription.endDate && typeof subscription.endDate === 'object' && 'seconds' in subscription.endDate) {
        // Firestore timestamp format
        const timestamp = subscription.endDate as any;
        endDate = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
        console.log('📅 SubscriptionService: Converted Firestore timestamp - seconds:', timestamp.seconds, 'nanoseconds:', timestamp.nanoseconds);
      } else if (subscription.endDate instanceof Date) {
        endDate = subscription.endDate;
        console.log('📅 SubscriptionService: Using Date object directly');
      } else if (typeof subscription.endDate === 'string') {
        endDate = new Date(subscription.endDate);
        console.log('📅 SubscriptionService: Converted string to Date');
      } else {
        console.error('❌ SubscriptionService: Invalid endDate format:', subscription.endDate);
        return false;
      }
      
      console.log('📅 SubscriptionService: Subscription end timestamp:', endDate.getTime(), 'Date:', endDate.toISOString());
      console.log('📊 SubscriptionService: Subscription status:', subscription.status);
      console.log('⏰ SubscriptionService: Time comparison - now < endDate:', now.getTime() < endDate.getTime());
      
      const isActive = subscription.status === 'active' && endDate > now;
      console.log('✅ SubscriptionService: Final hasActiveSubscription result:', isActive);
      
      return isActive;
    } catch (error) {
      console.error('❌ SubscriptionService: Error in hasActiveSubscription:', error);
      return false;
    }
  }

  // Create payment order
  static async createPaymentOrder(userId: string, planId: string): Promise<PaymentOrder> {
    try {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Invalid subscription plan');
      }

      // Create order in Firestore
      const orderData = {
        userId,
        planId,
        amount: plan.price,
        currency: 'INR',
        status: 'created' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const orderRef = await addDoc(collection(db, 'paymentOrders'), orderData);

      return {
        id: orderRef.id,
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating payment order:', error);
      throw error;
    }
  }


  // Process successful payment
  static async processSuccessfulPayment(orderId: string, paymentId: string): Promise<void> {
    try {
      // Get payment order
      const orderDoc = await getDoc(doc(db, 'paymentOrders', orderId));
      if (!orderDoc.exists()) {
        throw new Error('Payment order not found');
      }

      const orderData = orderDoc.data() as PaymentOrder;
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === orderData.planId);
      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.duration);

      // Create subscription
      const subscriptionData = {
        userId: orderData.userId,
        planId: orderData.planId,
        status: 'active' as const,
        startDate: startDate,
        endDate: endDate,
        paymentId,
        orderId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'subscriptions'), subscriptionData);

      // Update payment order status
      await updateDoc(doc(db, 'paymentOrders', orderId), {
        status: 'paid',
        updatedAt: serverTimestamp()
      });

      console.log('Subscription created successfully');
    } catch (error) {
      console.error('Error processing successful payment:', error);
      throw error;
    }
  }

  // Cancel subscription
  static async cancelSubscription(userId: string): Promise<void> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        throw new Error('No active subscription found');
      }

      await updateDoc(doc(db, 'subscriptions', subscription.id), {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });

      console.log('Subscription cancelled successfully');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // Get subscription history
  static async getSubscriptionHistory(userId: string): Promise<UserSubscription[]> {
    try {
      const subscriptionsRef = collection(db, 'subscriptions');
      const q = query(
        subscriptionsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserSubscription[];
    } catch (error) {
      console.error('Error fetching subscription history:', error);
      return [];
    }
  }

  // Create enhanced payment order with coupon support
  static async createEnhancedPaymentOrder(orderData: {
    userId: string;
    planId: string;
    amount: number;
    originalAmount: number;
    discountAmount: number;
    couponCode?: string;
  }): Promise<EnhancedPaymentOrder> {
    try {
      console.log('💳 SubscriptionService: Creating enhanced payment order:', orderData);
      
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === orderData.planId);
      if (!plan) {
        throw new Error('Invalid subscription plan');
      }

      // Create order in Firestore - handle undefined values
      const enhancedOrderData: any = {
        userId: orderData.userId,
        planId: orderData.planId,
        amount: orderData.amount,
        originalAmount: orderData.originalAmount,
        discountAmount: orderData.discountAmount,
        currency: 'INR',
        status: 'created' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Only add couponCode if it's not undefined
      if (orderData.couponCode) {
        enhancedOrderData.couponCode = orderData.couponCode;
      }

      const orderRef = await addDoc(collection(db, 'paymentOrders'), enhancedOrderData);
      
      console.log('✅ SubscriptionService: Enhanced payment order created:', orderRef.id);
      
      return {
        id: orderRef.id,
        ...enhancedOrderData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ SubscriptionService: Error creating enhanced payment order:', error);
      throw error;
    }
  }

  // Activate subscription after successful payment
  static async activateSubscription(userId: string, planId: string, orderId: string): Promise<void> {
    try {
      console.log('🎉 SubscriptionService: Activating subscription for user:', userId);
      
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.duration);

      // Create subscription
      const subscriptionData = {
        userId,
        planId,
        status: 'active' as const,
        startDate: startDate,
        endDate: endDate,
        orderId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'subscriptions'), subscriptionData);

      // Update payment order status
      await updateDoc(doc(db, 'paymentOrders', orderId), {
        status: 'paid',
        updatedAt: serverTimestamp()
      });

      console.log('✅ SubscriptionService: Subscription activated successfully');
    } catch (error) {
      console.error('❌ SubscriptionService: Error activating subscription:', error);
      throw error;
    }
  }

  // Create UPI payment record
  static async createUPIPayment(orderId: string, userId: string, upiId: string, amount: number): Promise<UPIPayment> {
    try {
      console.log('💰 SubscriptionService: Creating UPI payment record');
      
      const upiPaymentData = {
        orderId,
        userId,
        upiId,
        amount,
        status: 'pending' as const,
        createdAt: serverTimestamp()
      };

      const paymentRef = await addDoc(collection(db, 'upiPayments'), upiPaymentData);
      
      return {
        id: paymentRef.id,
        ...upiPaymentData,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('❌ SubscriptionService: Error creating UPI payment:', error);
      throw error;
    }
  }

  // Update UPI payment status
  static async updateUPIPaymentStatus(paymentId: string, status: 'completed' | 'failed' | 'expired', paymentReference?: string): Promise<void> {
    try {
      console.log('📝 SubscriptionService: Updating UPI payment status:', paymentId, status);
      
      const updateData: any = {
        status,
        updatedAt: serverTimestamp()
      };

      if (status === 'completed') {
        updateData.completedAt = serverTimestamp();
        if (paymentReference) {
          updateData.paymentReference = paymentReference;
        }
      }

      await updateDoc(doc(db, 'upiPayments', paymentId), updateData);
      
      console.log('✅ SubscriptionService: UPI payment status updated');
    } catch (error) {
      console.error('❌ SubscriptionService: Error updating UPI payment status:', error);
      throw error;
    }
  }

  // Get user payment history
  static async getUserPaymentHistory(userId: string): Promise<PaymentOrder[]> {
    try {
      console.log('💳 SubscriptionService: Fetching payment history for user:', userId);
      
      const paymentsRef = collection(db, 'paymentOrders');
      const q = query(
        paymentsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      console.log('📊 SubscriptionService: Found payment records:', snapshot.size);
      
      const paymentHistory = snapshot.docs.map(doc => {
        const data = doc.data() as PaymentOrder;
        // Convert Firestore timestamps to Date objects
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(),
          updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date()
        };
      });
      
      console.log('✅ SubscriptionService: Payment history fetched successfully');
      return paymentHistory;
    } catch (error) {
      console.error('❌ SubscriptionService: Error fetching payment history:', error);
      return [];
    }
  }
}

// Create and export default instance
const subscriptionService = new SubscriptionService();
export default subscriptionService;