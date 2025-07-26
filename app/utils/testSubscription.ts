import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserSubscription } from '../../src/types';

// Test function to create a subscription for testing
export const createTestSubscription = async (userId: string) => {
  try {
    console.log('🧪 Creating test subscription for user:', userId);
    
    // Create a test subscription that expires in 30 days
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    const subscriptionData = {
      userId,
      planId: 'monthly',
      status: 'active',
      startDate: new Date(),
      endDate: endDate,
      paymentId: 'test_payment_' + Date.now(),
      orderId: 'test_order_' + Date.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'subscriptions'), subscriptionData);
    console.log('✅ Test subscription created with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating test subscription:', error);
    throw error;
  }
};

// Test function to remove test subscriptions
export const removeTestSubscriptions = async (userId: string) => {
  try {
    console.log('🧹 This function would remove test subscriptions for user:', userId);
    // Implementation would go here to clean up test data
  } catch (error) {
    console.error('❌ Error removing test subscriptions:', error);
  }
};