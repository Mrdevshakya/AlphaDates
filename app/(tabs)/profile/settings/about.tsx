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

const APP_VERSION = '1.0.0';

export default function AboutScreen() {
  const handleBack = () => {
    router.back();
  };

  const handleLinkPress = (type: string) => {
    switch (type) {
      case 'privacy':
        Linking.openURL('https://alphadate.com/privacy');
        break;
      case 'terms':
        Linking.openURL('https://alphadate.com/terms');
        break;
      case 'licenses':
        Alert.alert('Coming Soon', 'Open source licenses will be available soon!');
        break;
      case 'website':
        Linking.openURL('https://alphadate.com');
        break;
    }
  };

  const renderLinkItem = (
    icon: string,
    title: string,
    onPress: () => void,
  ) => (
    <TouchableOpacity style={styles.linkItem} onPress={onPress}>
      <View style={styles.linkLeft}>
        <Ionicons name={icon as any} size={24} color="#FF4B6A" />
        <Text style={styles.linkText}>{title}</Text>
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
          <Text style={styles.headerTitle}>About</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <BlurView intensity={10} tint="dark" style={styles.section}>
          <View style={styles.appInfo}>
            <Ionicons name="heart" size={48} color="#FF4B6A" />
            <Text style={styles.appName}>AlphaDate</Text>
            <Text style={styles.appVersion}>Version {APP_VERSION}</Text>
            <Text style={styles.appDescription}>
              Find your perfect match with AlphaDate - where meaningful connections happen.
            </Text>
          </View>
        </BlurView>

        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          {renderLinkItem(
            'shield-outline',
            'Privacy Policy',
            () => handleLinkPress('privacy')
          )}
          {renderLinkItem(
            'document-text-outline',
            'Terms of Service',
            () => handleLinkPress('terms')
          )}
          {renderLinkItem(
            'code-outline',
            'Open Source Licenses',
            () => handleLinkPress('licenses')
          )}
        </BlurView>

        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Connect</Text>
          {renderLinkItem(
            'globe-outline',
            'Visit Our Website',
            () => handleLinkPress('website')
          )}
          {renderLinkItem(
            'logo-instagram',
            'Follow on Instagram',
            () => Alert.alert('Coming Soon', 'Instagram link will be available soon!')
          )}
          {renderLinkItem(
            'logo-twitter',
            'Follow on Twitter',
            () => Alert.alert('Coming Soon', 'Twitter link will be available soon!')
          )}
        </BlurView>

        <View style={styles.footer}>
          <Text style={styles.copyright}>
            © {new Date().getFullYear()} AlphaDate. All rights reserved.
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
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  appInfo: {
    alignItems: 'center',
    padding: 30,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 15,
  },
  appVersion: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 5,
  },
  appDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4B6A',
    padding: 15,
    paddingBottom: 5,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 15,
  },
  footer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  copyright: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
}); 