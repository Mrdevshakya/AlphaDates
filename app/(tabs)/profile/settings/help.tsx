import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function HelpScreen() {
  const handleBack = () => {
    router.back();
  };

  const renderHelpItem = (
    icon: string,
    title: string,
    description: string,
    onPress: () => void,
  ) => (
    <TouchableOpacity style={styles.helpItem} onPress={onPress}>
      <View style={styles.helpLeft}>
        <Ionicons name={icon as any} size={24} color="#FF4B6A" />
        <View style={styles.helpTexts}>
          <Text style={styles.helpTitle}>{title}</Text>
          <Text style={styles.helpDescription}>{description}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
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
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Get Help</Text>
          {renderHelpItem(
            'chatbubble-ellipses-outline',
            'Live Chat Support',
            'Chat with our support team instantly',
            () => {
              router.push('/chat/support');
            }
          )}
          {renderHelpItem(
            'mail-outline',
            'Email Support',
            'Send us an email, we\'ll respond within 24 hours',
            () => {
              Linking.openURL('mailto:support@alphadate.com');
            }
          )}
          {renderHelpItem(
            'document-text-outline',
            'Help Articles',
            'Browse our help articles and guides',
            () => {
              Linking.openURL('https://help.alphadate.com');
            }
          )}
        </BlurView>

        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Common Topics</Text>
          {renderHelpItem(
            'shield-outline',
            'Safety & Privacy',
            'Learn about our safety features and guidelines',
            () => {
              Linking.openURL('https://help.alphadate.com/safety');
            }
          )}
          {renderHelpItem(
            'warning-outline',
            'Report an Issue',
            'Report bugs, abuse, or other concerns',
            () => {
              router.push('/report-issue');
            }
          )}
          {renderHelpItem(
            'information-circle-outline',
            'Account & Billing',
            'Get help with your account or payments',
            () => {
              Linking.openURL('https://help.alphadate.com/account');
            }
          )}
        </BlurView>

        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Community</Text>
          {renderHelpItem(
            'people-outline',
            'Community Guidelines',
            'Read our community rules and standards',
            () => {
              Linking.openURL('https://alphadate.com/guidelines');
            }
          )}
          {renderHelpItem(
            'newspaper-outline',
            'Blog & Updates',
            'Stay updated with latest news and features',
            () => {
              Linking.openURL('https://blog.alphadate.com');
            }
          )}
          {renderHelpItem(
            'heart-outline',
            'Success Stories',
            'Read stories from our community',
            () => {
              Linking.openURL('https://alphadate.com/stories');
            }
          )}
        </BlurView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Need immediate assistance? Try our live chat support for fastest response.
          </Text>
        </View>

        <View style={{ height: 40 }} />
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
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  helpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  helpTexts: {
    marginLeft: 15,
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 4,
  },
  helpDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
}); 