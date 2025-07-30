import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function RefundPolicyScreen() {
  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FF4B6A', '#FF8C9F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Refund Policy</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>
          
          <Text style={styles.sectionTitle}>1. General Refund Policy</Text>
          <Text style={styles.sectionText}>
            At AlphaDate, we strive to provide the best dating experience. However, due to the 
            nature of our digital service, we have a strict no-refund policy for subscription 
            purchases, except in specific circumstances outlined below.
          </Text>

          <Text style={styles.sectionTitle}>2. No Refund Policy</Text>
          <Text style={styles.sectionText}>
            All subscription payments are final and non-refundable, including but not limited to:
          </Text>
          <Text style={styles.bulletPoint}>• Monthly, quarterly, half-yearly, and yearly subscriptions</Text>
          <Text style={styles.bulletPoint}>• Premium features and boosts</Text>
          <Text style={styles.bulletPoint}>• In-app purchases and upgrades</Text>
          <Text style={styles.bulletPoint}>• Unused portions of active subscriptions</Text>

          <Text style={styles.sectionTitle}>3. Exceptional Circumstances</Text>
          <Text style={styles.sectionText}>
            Refunds may be considered only in the following exceptional circumstances:
          </Text>
          <Text style={styles.bulletPoint}>• Technical error resulting in duplicate charges</Text>
          <Text style={styles.bulletPoint}>• Unauthorized transactions (with proper documentation)</Text>
          <Text style={styles.bulletPoint}>• Service unavailability for extended periods (7+ days)</Text>
          <Text style={styles.bulletPoint}>• Account suspension due to our error</Text>

          <Text style={styles.sectionTitle}>4. Subscription Cancellation</Text>
          <Text style={styles.sectionText}>
            You can cancel your subscription at any time through the app settings:
          </Text>
          <Text style={styles.bulletPoint}>• Cancellation takes effect at the end of current billing period</Text>
          <Text style={styles.bulletPoint}>• You retain access to premium features until expiration</Text>
          <Text style={styles.bulletPoint}>• No partial refunds for early cancellation</Text>
          <Text style={styles.bulletPoint}>• Auto-renewal will be disabled upon cancellation</Text>

          <Text style={styles.sectionTitle}>5. How to Cancel Your Subscription</Text>
          <Text style={styles.sectionText}>
            To cancel your subscription:
          </Text>
          <Text style={styles.bulletPoint}>• Go to Profile → Settings → Account</Text>
          <Text style={styles.bulletPoint}>• Select "Manage Subscription"</Text>
          <Text style={styles.bulletPoint}>• Choose "Cancel Subscription"</Text>
          <Text style={styles.bulletPoint}>• Confirm your cancellation</Text>

          <Text style={styles.sectionTitle}>6. Refund Request Process</Text>
          <Text style={styles.sectionText}>
            If you believe you qualify for a refund under exceptional circumstances:
          </Text>
          <Text style={styles.bulletPoint}>• Contact our support team within 48 hours of the charge</Text>
          <Text style={styles.bulletPoint}>• Provide transaction details and reason for refund request</Text>
          <Text style={styles.bulletPoint}>• Include any supporting documentation</Text>
          <Text style={styles.bulletPoint}>• Allow 5-7 business days for review and response</Text>

          <Text style={styles.sectionTitle}>7. Refund Processing</Text>
          <Text style={styles.sectionText}>
            If a refund is approved:
          </Text>
          <Text style={styles.bulletPoint}>• Refunds will be processed to the original payment method</Text>
          <Text style={styles.bulletPoint}>• Processing time: 5-10 business days</Text>
          <Text style={styles.bulletPoint}>• Your premium access will be immediately revoked</Text>
          <Text style={styles.bulletPoint}>• Account may be subject to review</Text>

          <Text style={styles.sectionTitle}>8. Chargebacks and Disputes</Text>
          <Text style={styles.sectionText}>
            Initiating a chargeback without contacting us first may result in:
          </Text>
          <Text style={styles.bulletPoint}>• Immediate account suspension</Text>
          <Text style={styles.bulletPoint}>• Loss of all account data and matches</Text>
          <Text style={styles.bulletPoint}>• Permanent ban from the platform</Text>

          <Text style={styles.sectionTitle}>9. Contact for Refund Requests</Text>
          <Text style={styles.sectionText}>
            For refund requests or billing inquiries, contact us at:
          </Text>
          <Text style={styles.contactInfo}>Email: billing@alphadate.com</Text>
          <Text style={styles.contactInfo}>Phone: +91-XXXXXXXXXX</Text>
          <Text style={styles.contactInfo}>Support Hours: 9 AM - 6 PM (Mon-Fri)</Text>

          <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
          <Text style={styles.sectionText}>
            We reserve the right to modify this refund policy at any time. Changes will be 
            effective immediately upon posting. Continued use of the service constitutes 
            acceptance of the updated policy.
          </Text>

          <Text style={styles.importantNote}>
            Important: By purchasing a subscription, you acknowledge that you have read, 
            understood, and agree to this refund policy.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF4B6A',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 16,
    color: '#FFF',
    lineHeight: 24,
    marginBottom: 10,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#CCC',
    lineHeight: 24,
    marginBottom: 5,
    marginLeft: 10,
  },
  contactInfo: {
    fontSize: 16,
    color: '#FF4B6A',
    lineHeight: 24,
    marginBottom: 5,
    marginLeft: 10,
  },
  importantNote: {
    fontSize: 16,
    color: '#FFD700',
    lineHeight: 24,
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
});