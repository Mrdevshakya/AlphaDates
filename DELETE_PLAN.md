# Files to Delete - Duplicate/Extra Files

## Confirmed Duplicates (Deleted):
1. `app/payment/index.ts` - Redundant export file (keep the .tsx version which contains actual component)
2. `app/components/CheckoutPage.tsx` - Duplicate checkout implementation (keep app/payment/checkout.tsx)

## Potential Duplicates (Needs Review):
1. `app/components/SubscriptionPlans.tsx` and `app/components/PlanCard.tsx` - May have overlapping functionality
2. `app/components/Stories.tsx` and `app/stories/[id].tsx` - May have overlapping story functionality
3. Multiple camera-related implementations in `app/camera.tsx` and potentially in tabs

## Extra Files:
1. Firebase admin SDK JSON files (security risk if not needed locally):
   - `afnny-ed7bb-firebase-adminsdk-fbsvc-1cf581fe3b.json`
   - `afnny-ed7bb-firebase-adminsdk-fbsvc-c34f8e28af.json`
2. Debug log files (firestore-debug.log, pglite-debug.log)

## Additional Observations:
1. Multiple payment-related files in both `app/payment/` directory and `app/components/` directory
2. Potential duplicate media handling functionality between `app/edit-media.tsx` and utilities in `app/utils/`
