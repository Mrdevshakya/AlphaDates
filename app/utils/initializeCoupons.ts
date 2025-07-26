import couponService from './couponService';

// Initialize default coupons for the application
export const initializeDefaultCoupons = async (adminUserId: string = 'admin') => {
  try {
    console.log('🎫 Initializing default coupons...');
    
    await couponService.createDefaultCoupons(adminUserId);
    
    console.log('✅ Default coupons initialized successfully!');
    console.log('Available coupons:');
    console.log('- AMITY2025: 70% discount (valid for 1 year)');
    console.log('- WELCOME50: 50% discount (valid for 30 days)');
    console.log('- STUDENT25: 25% discount (valid for 90 days)');
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing default coupons:', error);
    return false;
  }
};

// Function to test coupon validation
export const testCouponValidation = async () => {
  try {
    console.log('🧪 Testing coupon validation...');
    
    // Test valid coupon
    const validResult = await couponService.validateCoupon('AMITY2025', 'monthly');
    console.log('Valid coupon test:', validResult);
    
    // Test invalid coupon
    const invalidResult = await couponService.validateCoupon('INVALID123', 'monthly');
    console.log('Invalid coupon test:', invalidResult);
    
    // Test discount calculation
    const discount = couponService.calculateDiscount(100, 70);
    console.log('Discount calculation (₹100 with 70%):', discount);
    
    return true;
  } catch (error) {
    console.error('❌ Error testing coupon validation:', error);
    return false;
  }
};