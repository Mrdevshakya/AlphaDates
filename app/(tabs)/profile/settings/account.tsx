import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

export default function AccountSettings() {
  const { userData, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await logout();
              router.replace('/(auth)/sign-in');
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to logout. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle: string | undefined,
    onPress: () => void,
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color="#FF4B6A" />
        <View style={styles.settingTexts}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Loading Modal */}
      <Modal
        transparent
        visible={isLoading}
        animationType="fade"
      >
        <View style={styles.loadingModal}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#FF4B6A" />
            <Text style={styles.loadingText}>Logging out...</Text>
          </View>
        </View>
      </Modal>

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
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Account Management</Text>
          {renderSettingItem(
            'person-circle-outline',
            'Account Center',
            'Manage your profile information',
            () => router.push('/profile/settings/account-center')
          )}
        </BlurView>

        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Match Preferences</Text>
          {renderSettingItem(
            'filter-outline',
            'Match Filters',
            'Set your matching preferences',
            () => {
              Alert.alert('Coming Soon', 'Match filters will be available soon!');
            }
          )}
          {renderSettingItem(
            'compass-outline',
            'Distance Range',
            'Set maximum distance for matches',
            () => {
              Alert.alert('Coming Soon', 'Distance settings will be available soon!');
            }
          )}
          {renderSettingItem(
            'heart-outline',
            'Interest Tags',
            'Manage your interests for better matches',
            () => {
              Alert.alert('Coming Soon', 'Interest management will be available soon!');
            }
          )}
        </BlurView>

        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Security & Verification</Text>
          {renderSettingItem(
            'lock-closed-outline',
            'Password & Security',
            'Update password and security settings',
            () => router.push('/profile/settings/security')
          )}
          {renderSettingItem(
            'checkmark-circle-outline',
            'Profile Verification',
            'Verify your profile for trust',
            () => {
              Alert.alert('Coming Soon', 'Profile verification will be available soon!');
            }
          )}
          {renderSettingItem(
            'phone-portrait-outline',
            'Connected Devices',
            'Manage devices and sessions',
            () => {
              Alert.alert('Coming Soon', 'Device management will be available soon!');
            }
          )}
        </BlurView>

        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          {renderSettingItem(
            'language-outline',
            'Language',
            'Change app language',
            () => {
              Alert.alert(
                'Select Language',
                'Choose your preferred language',
                [
                  { text: 'English', onPress: () => {} },
                  { text: 'Hindi', onPress: () => {} },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }
          )}
          {renderSettingItem(
            'color-palette-outline',
            'Theme',
            'Change app appearance',
            () => {
              Alert.alert(
                'Select Theme',
                'Choose your preferred theme',
                [
                  { text: 'Light', onPress: () => {} },
                  { text: 'Dark', onPress: () => {} },
                  { text: 'System', onPress: () => {} },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }
          )}
          {renderSettingItem(
            'help-circle-outline',
            'Help & Support',
            'Get help and contact support',
            () => router.push('/profile/settings/help')
          )}
        </BlurView>

        <BlurView intensity={10} tint="dark" style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, styles.dangerText]}>Danger Zone</Text>
          {renderSettingItem(
            'pause-circle-outline',
            'Pause Account',
            'Temporarily hide your profile',
            () => {
              Alert.alert(
                'Pause Account',
                'Your profile will be hidden from all users. Continue?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Pause Account', 
                    style: 'destructive',
                    onPress: () => Alert.alert('Coming Soon', 'Account pausing will be available soon!')
                  }
                ]
              );
            }
          )}
          {renderSettingItem(
            'log-out-outline',
            'Logout',
            'Sign out of your account',
            handleLogout
          )}
          {renderSettingItem(
            'trash-outline',
            'Delete Account',
            'This action cannot be undone',
            () => {
              Alert.alert(
                'Delete Account',
                'Are you sure you want to delete your account? This action cannot be undone.',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      Alert.alert('Feature coming soon');
                    },
                  },
                ]
              );
            }
          )}
        </BlurView>

        {/* Add some bottom padding for better scrolling */}
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTexts: {
    marginLeft: 15,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: 'white',
  },
  settingSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  dangerSection: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  dangerText: {
    color: '#FF3B30',
  },
  loadingModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 16,
  },
}); 