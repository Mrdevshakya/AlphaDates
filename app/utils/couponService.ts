import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { CouponCode, CouponUsage } from '../../src/types';

export class CouponService {
  private static instance: CouponService;
  
  public static getInstance(): CouponService {
    if (!CouponService.instance) {
      CouponService.instance = new CouponService();
    }
    return CouponService.instance;
  }

  // Create a new coupon code (Admin only)
  async createCoupon(couponData: Omit<CouponCode, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('🎫 CouponService: Creating new coupon:', couponData.code);
      
      const couponRef = await addDoc(collection(db, 'coupons'), {
        ...couponData,
        usedCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      console.log('✅ CouponService: Coupon created with ID:', couponRef.id);
      return couponRef.id;
    } catch (error) {
      console.error('❌ CouponService: Error creating coupon:', error);
      throw error;
    }
  }

  // Validate and get coupon details
  async validateCoupon(code: string, planId: string): Promise<{ isValid: boolean; coupon?: CouponCode; error?: string }> {
    try {
      console.log('🔍 CouponService: Validating coupon:', code, 'for plan:', planId);
      
      const couponsRef = collection(db, 'coupons');
      const q = query(couponsRef, where('code', '==', code.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { isValid: false, error: 'Coupon code not found' };
      }

      const couponDoc = querySnapshot.docs[0];
      const coupon = { id: couponDoc.id, ...couponDoc.data() } as CouponCode;

      // Convert Firestore timestamps to Date objects
      coupon.validFrom = coupon.validFrom instanceof Timestamp ? coupon.validFrom.toDate() : new Date(coupon.validFrom);
      coupon.validUntil = coupon.validUntil instanceof Timestamp ? coupon.validUntil.toDate() : new Date(coupon.validUntil);
      coupon.createdAt = coupon.createdAt instanceof Timestamp ? coupon.createdAt.toDate() : new Date(coupon.createdAt);
      coupon.updatedAt = coupon.updatedAt instanceof Timestamp ? coupon.updatedAt.toDate() : new Date(coupon.updatedAt);

      // Check if coupon is active
      if (!coupon.isActive) {
        return { isValid: false, error: 'Coupon code is inactive' };
      }

      // Check validity dates
      const now = new Date();
      if (now < coupon.validFrom) {
        return { isValid: false, error: 'Coupon code is not yet valid' };
      }
      if (now > coupon.validUntil) {
        return { isValid: false, error: 'Coupon code has expired' };
      }

      // Check usage limit
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return { isValid: false, error: 'Coupon usage limit exceeded' };
      }

      // Check if applicable to the plan
      if (coupon.applicablePlans.length > 0 && !coupon.applicablePlans.includes(planId)) {
        return { isValid: false, error: 'Coupon not applicable to this plan' };
      }

      console.log('✅ CouponService: Coupon is valid:', coupon);
      return { isValid: true, coupon };
    } catch (error) {
      console.error('❌ CouponService: Error validating coupon:', error);
      return { isValid: false, error: 'Error validating coupon' };
    }
  }

  // Calculate discount amount
  calculateDiscount(originalAmount: number, discountPercentage: number): number {
    return Math.round((originalAmount * discountPercentage) / 100);
  }

  // Apply coupon and record usage
  async applyCoupon(couponId: string, userId: string, orderId: string, discountAmount: number): Promise<void> {
    try {
      console.log('🎫 CouponService: Applying coupon:', couponId, 'for user:', userId);
      
      // Record coupon usage
      await addDoc(collection(db, 'couponUsages'), {
        couponId,
        userId,
        orderId,
        discountAmount,
        usedAt: Timestamp.now(),
      });

      // Update coupon used count
      const couponRef = doc(db, 'coupons', couponId);
      const couponDoc = await getDoc(couponRef);
      
      if (couponDoc.exists()) {
        const currentUsedCount = couponDoc.data().usedCount || 0;
        await updateDoc(couponRef, {
          usedCount: currentUsedCount + 1,
          updatedAt: Timestamp.now(),
        });
      }

      console.log('✅ CouponService: Coupon applied successfully');
    } catch (error) {
      console.error('❌ CouponService: Error applying coupon:', error);
      throw error;
    }
  }

  // Get all active coupons (Admin only)
  async getAllCoupons(): Promise<CouponCode[]> {
    try {
      console.log('📋 CouponService: Fetching all coupons');
      
      const couponsRef = collection(db, 'coupons');
      const q = query(couponsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const coupons: CouponCode[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const coupon: CouponCode = {
          id: doc.id,
          ...data,
          validFrom: data.validFrom instanceof Timestamp ? data.validFrom.toDate() : new Date(data.validFrom),
          validUntil: data.validUntil instanceof Timestamp ? data.validUntil.toDate() : new Date(data.validUntil),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as CouponCode;
        coupons.push(coupon);
      });

      console.log('✅ CouponService: Found coupons:', coupons.length);
      return coupons;
    } catch (error) {
      console.error('❌ CouponService: Error fetching coupons:', error);
      throw error;
    }
  }

  // Update coupon (Admin only)
  async updateCoupon(couponId: string, updates: Partial<CouponCode>): Promise<void> {
    try {
      console.log('📝 CouponService: Updating coupon:', couponId);
      
      const couponRef = doc(db, 'coupons', couponId);
      await updateDoc(couponRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });

      console.log('✅ CouponService: Coupon updated successfully');
    } catch (error) {
      console.error('❌ CouponService: Error updating coupon:', error);
      throw error;
    }
  }

  // Delete coupon (Admin only)
  async deleteCoupon(couponId: string): Promise<void> {
    try {
      console.log('🗑️ CouponService: Deleting coupon:', couponId);
      
      const couponRef = doc(db, 'coupons', couponId);
      await deleteDoc(couponRef);

      console.log('✅ CouponService: Coupon deleted successfully');
    } catch (error) {
      console.error('❌ CouponService: Error deleting coupon:', error);
      throw error;
    }
  }

  // Get coupon usage statistics
  async getCouponUsage(couponId: string): Promise<CouponUsage[]> {
    try {
      console.log('📊 CouponService: Fetching usage for coupon:', couponId);
      
      const usagesRef = collection(db, 'couponUsages');
      const q = query(usagesRef, where('couponId', '==', couponId), orderBy('usedAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const usages: CouponUsage[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const usage: CouponUsage = {
          id: doc.id,
          ...data,
          usedAt: data.usedAt instanceof Timestamp ? data.usedAt.toDate() : new Date(data.usedAt),
        } as CouponUsage;
        usages.push(usage);
      });

      console.log('✅ CouponService: Found usage records:', usages.length);
      return usages;
    } catch (error) {
      console.error('❌ CouponService: Error fetching coupon usage:', error);
      throw error;
    }
  }

  // Create default coupons for testing
  async createDefaultCoupons(adminUserId: string): Promise<void> {
    try {
      console.log('🎫 CouponService: Creating default coupons');
      
      const defaultCoupons = [
        {
          code: 'AMITY2025',
          discountPercentage: 70,
          isActive: true,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          usageLimit: 1000,
          applicablePlans: [], // All plans
          createdBy: adminUserId,
        },
        {
          code: 'WELCOME50',
          discountPercentage: 50,
          isActive: true,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          usageLimit: 100,
          applicablePlans: [], // All plans
          createdBy: adminUserId,
        },
        {
          code: 'STUDENT25',
          discountPercentage: 25,
          isActive: true,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          usageLimit: 500,
          applicablePlans: [], // All plans
          createdBy: adminUserId,
        },
      ];

      for (const coupon of defaultCoupons) {
        await this.createCoupon(coupon);
      }

      console.log('✅ CouponService: Default coupons created');
    } catch (error) {
      console.error('❌ CouponService: Error creating default coupons:', error);
      throw error;
    }
  }
}

export default CouponService.getInstance();