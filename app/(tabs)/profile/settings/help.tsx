import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const FAQs = [
  {
    question: 'How do I edit my profile?',
    answer: 'Go to Profile > Edit Profile to update your information, photos, and preferences.',
  },
  {
    question: 'How do matches work?',
    answer: 'Our matching algorithm considers your preferences, interests, and location to suggest compatible matches.',
  },
  {
    question: 'How can I change my privacy settings?',
    answer: 'Go to Settings > Privacy to control who can see your profile and how you appear to others.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, we use industry-standard encryption and security measures to protect your data.',
  },
  {
    question: 'How do I report inappropriate behavior?',
    answer: 'You can report users by clicking the three dots menu on their profile and selecting "Report".',
  },
];

export default function HelpCenter() {
  const handleBack = () => {
    router.back();
  };

  const handleContact = (method: 'email' | 'chat' | 'phone') => {
    switch (method) {
      case 'email':
        Linking.openURL('mailto:support@afnny.com');
        break;
      case 'chat':
        Alert.alert('Coming Soon', 'Live chat support will be available soon!');
        break;
      case 'phone':
        Linking.openURL('tel:+1234567890');
        break;
    }
  };

  const renderFAQItem = (question: string, answer: string) => (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={() => Alert.alert(question, answer)}
    >
      <View style={styles.faqLeft}>
        <Ionicons name="help-circle-outline" size={24} color="#FF4B6A" />
        <Text style={styles.faqQuestion}>{question}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666" />
    </TouchableOpacity>
  );

  const renderContactItem = (
    icon: string,
    title: string,
    subtitle: string,
    onPress: () => void,
  ) => (
    <TouchableOpacity style={styles.contactItem} onPress={onPress}>
      <View style={styles.contactLeft}>
        <Ionicons name={icon as any} size={24} color="#FF4B6A" />
        <View style={styles.contactTexts}>
          <Text style={styles.contactTitle}>{title}</Text>
          <Text style={styles.contactSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666" />
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>Help Center</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          {renderContactItem(
            'mail-outline',
            'Email Support',
            'support@afnny.com',
            () => handleContact('email')
          )}
          {renderContactItem(
            'chatbubbles-outline',
            'Live Chat',
            'Chat with our support team',
            () => handleContact('chat')
          )}
          {renderContactItem(
            'call-outline',
            'Phone Support',
            '+1 (234) 567-890',
            () => handleContact('phone')
          )}
        </BlurView>

        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {FAQs.map((faq, index) => (
            <React.Fragment key={index}>
              {renderFAQItem(faq.question, faq.answer)}
            </React.Fragment>
          ))}
        </BlurView>

        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Resources</Text>
          <TouchableOpacity 
            style={styles.resourceItem}
            onPress={() => Alert.alert('Coming Soon', 'User guide will be available soon!')}
          >
            <View style={styles.resourceLeft}>
              <Ionicons name="book-outline" size={24} color="#FF4B6A" />
              <Text style={styles.resourceText}>User Guide</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.resourceItem}
            onPress={() => Alert.alert('Coming Soon', 'Video tutorials will be available soon!')}
          >
            <View style={styles.resourceLeft}>
              <Ionicons name="videocam-outline" size={24} color="#FF4B6A" />
              <Text style={styles.resourceText}>Video Tutorials</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        </BlurView>
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
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4B6A',
    padding: 15,
    paddingBottom: 5,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactTexts: {
    marginLeft: 15,
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    color: 'white',
  },
  contactSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  faqLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  faqQuestion: {
    fontSize: 16,
    color: 'white',
    marginLeft: 15,
    flex: 1,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  resourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 15,
  },
}); 