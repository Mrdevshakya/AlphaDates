import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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

export default function AccountSettings() {
  const { userData } = useAuth();

  const handleBack = () => {
    router.back();
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
          <Text style={styles.headerTitle}>Account Settings</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          {renderSettingItem(
            'person-outline',
            'Name',
            userData?.name,
            () => router.push('/profile/edit')
          )}
          {renderSettingItem(
            'at-outline',
            'Username',
            `@${userData?.username}`,
            () => router.push('/profile/edit')
          )}
          {renderSettingItem(
            'mail-outline',
            'Email',
            userData?.email,
            () => router.push('/profile/edit')
          )}
          {renderSettingItem(
            'call-outline',
            'Phone Number',
            userData?.mobileNumber || 'Not set',
            () => router.push('/profile/edit')
          )}
        </BlurView>

        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          {renderSettingItem(
            'location-outline',
            'Location',
            userData?.location || 'Not set',
            () => router.push('/profile/edit')
          )}
          {renderSettingItem(
            'briefcase-outline',
            'Work',
            userData?.work || 'Not set',
            () => router.push('/profile/edit')
          )}
          {renderSettingItem(
            'school-outline',
            'Education',
            userData?.education || 'Not set',
            () => router.push('/profile/edit')
          )}
        </BlurView>

        <BlurView intensity={10} tint="dark" style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, styles.dangerText]}>Danger Zone</Text>
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
                      // Handle account deletion
                      Alert.alert('Feature coming soon');
                    },
                  },
                ]
              );
            }
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
}); 