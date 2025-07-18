import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

export default function SecuritySettings() {
  const { user, userData, setUserData } = useAuth();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(userData?.securitySettings?.twoFactorEnabled ?? false);
  const [biometricEnabled, setBiometricEnabled] = useState(userData?.securitySettings?.biometricEnabled ?? false);
  const [locationEnabled, setLocationEnabled] = useState(userData?.securitySettings?.locationEnabled ?? true);

  const handleBack = () => {
    router.back();
  };

  const handleSecurityToggle = async (field: string, value: boolean) => {
    if (!user || !userData) return;

    try {
      const updatedSettings = {
        ...userData.securitySettings,
        [field]: value,
      };

      await updateDoc(doc(db, 'users', user.uid), {
        securitySettings: updatedSettings,
      });

      setUserData({
        ...userData,
        securitySettings: updatedSettings,
      });

      switch (field) {
        case 'twoFactorEnabled':
          setTwoFactorEnabled(value);
          if (value) {
            Alert.alert('Coming Soon', 'Two-factor authentication will be available soon!');
          }
          break;
        case 'biometricEnabled':
          setBiometricEnabled(value);
          if (value) {
            Alert.alert('Coming Soon', 'Biometric authentication will be available soon!');
          }
          break;
        case 'locationEnabled':
          setLocationEnabled(value);
          break;
      }
    } catch (error) {
      console.error('Error updating security settings:', error);
      Alert.alert('Error', 'Failed to update security settings');
    }
  };

  const handlePasswordChange = () => {
    Alert.alert('Coming Soon', 'Password change functionality will be available soon!');
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    description: string,
    value?: boolean,
    onToggle?: (value: boolean) => void,
    onPress?: () => void,
  ) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress && !onToggle}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color="#FF4B6A" />
        <View style={styles.settingTexts}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      {onToggle && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: '#666', true: '#FF4B6A' }}
          thumbColor={value ? '#fff' : '#fff'}
        />
      )}
      {onPress && <Ionicons name="chevron-forward" size={24} color="#666" />}
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
          <Text style={styles.headerTitle}>Security Settings</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Account Security</Text>
          {renderSettingItem(
            'lock-closed-outline',
            'Change Password',
            'Update your account password',
            undefined,
            undefined,
            handlePasswordChange
          )}
          {renderSettingItem(
            'shield-checkmark-outline',
            'Two-Factor Authentication',
            'Add an extra layer of security',
            twoFactorEnabled,
            (value) => handleSecurityToggle('twoFactorEnabled', value)
          )}
          {renderSettingItem(
            'finger-print-outline',
            'Biometric Login',
            'Use fingerprint or face recognition',
            biometricEnabled,
            (value) => handleSecurityToggle('biometricEnabled', value)
          )}
        </BlurView>

        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Location</Text>
          {renderSettingItem(
            'location-outline',
            'Location Services',
            'Allow app to access your location',
            locationEnabled,
            (value) => handleSecurityToggle('locationEnabled', value)
          )}
        </BlurView>

        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Login Activity</Text>
          {renderSettingItem(
            'time-outline',
            'Active Sessions',
            'View and manage active sessions',
            undefined,
            undefined,
            () => Alert.alert('Coming Soon', 'Session management will be available soon!')
          )}
          {renderSettingItem(
            'list-outline',
            'Login History',
            'View recent account activity',
            undefined,
            undefined,
            () => Alert.alert('Coming Soon', 'Login history will be available soon!')
          )}
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
  settingDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
}); 