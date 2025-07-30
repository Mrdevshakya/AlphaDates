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

export default function TermsConditionsScreen() {
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
          <Text style={styles.headerTitle}>Terms & Conditions</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>
          
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.sectionText}>
            By accessing and using AlphaDate, you accept and agree to be bound by the terms 
            and provision of this agreement. If you do not agree to abide by the above, 
            please do not use this service.
          </Text>

          <Text style={styles.sectionTitle}>2. Eligibility</Text>
          <Text style={styles.sectionText}>
            You must be at least 18 years old to use AlphaDate. By using our service, 
            you represent and warrant that:
          </Text>
          <Text style={styles.bulletPoint}>• You are at least 18 years of age</Text>
          <Text style={styles.bulletPoint}>• You have the legal capacity to enter into this agreement</Text>
          <Text style={styles.bulletPoint}>• You will comply with all applicable laws and regulations</Text>
          <Text style={styles.bulletPoint}>• All information you provide is accurate and truthful</Text>

          <Text style={styles.sectionTitle}>3. User Conduct</Text>
          <Text style={styles.sectionText}>
            You agree not to use AlphaDate to:
          </Text>
          <Text style={styles.bulletPoint}>• Upload false, misleading, or inappropriate content</Text>
          <Text style={styles.bulletPoint}>• Harass, abuse, or harm other users</Text>
          <Text style={styles.bulletPoint}>• Share explicit or inappropriate content</Text>
          <Text style={styles.bulletPoint}>• Spam or send unsolicited messages</Text>
          <Text style={styles.bulletPoint}>• Create fake profiles or impersonate others</Text>
          <Text style={styles.bulletPoint}>• Use the service for commercial purposes without permission</Text>

          <Text style={styles.sectionTitle}>4. Subscription and Payments</Text>
          <Text style={styles.sectionText}>
            AlphaDate offers premium features through paid subscriptions:
          </Text>
          <Text style={styles.bulletPoint}>• Subscription fees are charged in advance</Text>
          <Text style={styles.bulletPoint}>• All payments are processed securely through Razorpay</Text>
          <Text style={styles.bulletPoint}>• Subscriptions auto-renew unless cancelled</Text>
          <Text style={styles.bulletPoint}>• You can cancel your subscription at any time</Text>
          <Text style={styles.bulletPoint}>• Refunds are subject to our refund policy</Text>

          <Text style={styles.sectionTitle}>5. Content and Intellectual Property</Text>
          <Text style={styles.sectionText}>
            You retain ownership of content you upload, but grant AlphaDate a license to use it. 
            AlphaDate owns all rights to the app, design, and technology.
          </Text>

          <Text style={styles.sectionTitle}>6. Privacy and Data Protection</Text>
          <Text style={styles.sectionText}>
            Your privacy is important to us. Please review our Privacy Policy to understand 
            how we collect, use, and protect your information.
          </Text>

          <Text style={styles.sectionTitle}>7. Safety and Security</Text>
          <Text style={styles.sectionText}>
            While we strive to provide a safe environment, you are responsible for your own safety:
          </Text>
          <Text style={styles.bulletPoint}>• Meet in public places for first dates</Text>
          <Text style={styles.bulletPoint}>• Trust your instincts and report suspicious behavior</Text>
          <Text style={styles.bulletPoint}>• Do not share personal financial information</Text>
          <Text style={styles.bulletPoint}>• Use the in-app reporting features when needed</Text>

          <Text style={styles.sectionTitle}>8. Account Termination</Text>
          <Text style={styles.sectionText}>
            We reserve the right to suspend or terminate your account if you violate these terms. 
            You may also delete your account at any time through the app settings.
          </Text>

          <Text style={styles.sectionTitle}>9. Disclaimers</Text>
          <Text style={styles.sectionText}>
            AlphaDate is provided "as is" without warranties. We do not guarantee that you will 
            find a match or that the service will be uninterrupted or error-free.
          </Text>

          <Text style={styles.sectionTitle}>10. Limitation of Liability</Text>
          <Text style={styles.sectionText}>
            AlphaDate shall not be liable for any indirect, incidental, special, or consequential 
            damages arising from your use of the service.
          </Text>

          <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
          <Text style={styles.sectionText}>
            We may update these terms from time to time. Continued use of the service after 
            changes constitutes acceptance of the new terms.
          </Text>

          <Text style={styles.sectionTitle}>12. Contact Information</Text>
          <Text style={styles.sectionText}>
            If you have questions about these Terms & Conditions, contact us at:
          </Text>
          <Text style={styles.contactInfo}>Email: legal@alphadate.com</Text>
          <Text style={styles.contactInfo}>Phone: +91-XXXXXXXXXX</Text>
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
});