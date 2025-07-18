import React from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function SettingsScreen() {
  const { user, userData, setUserData, logout } = useAuth();
  const [isPrivate, setIsPrivate] = React.useState(userData?.isPrivate || false);

  const handleBack = () => {
    router.back();
  };

  const handlePrivacyToggle = async () => {
    if (!user || !userData) return;

    try {
      const newIsPrivate = !isPrivate;
      await updateDoc(doc(db, 'users', user.uid), {
        isPrivate: newIsPrivate
      });
      setIsPrivate(newIsPrivate);
      setUserData({ ...userData, isPrivate: newIsPrivate });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      Alert.alert('Error', 'Failed to update privacy settings');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/sign-in');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    onPress: () => void,
    showArrow = true,
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color="#FF4B6A" />
        <Text style={styles.settingText}>{title}</Text>
      </View>
      <View style={styles.settingRight}>
        {rightElement}
        {showArrow && <Ionicons name="chevron-forward" size={24} color="#666" />}
      </View>
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
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {renderSettingItem('person-outline', 'Edit Profile', () => router.push('/profile/edit'))}
          {renderSettingItem('notifications-outline', 'Notifications', () => router.push('/profile/notifications'))}
          {renderSettingItem('lock-closed-outline', 'Privacy', () => router.push('/profile/privacy'))}
          {renderSettingItem('shield-outline', 'Security', () => router.push('/profile/security'))}
        </BlurView>

        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          {renderSettingItem(
            'eye-outline',
            'Private Account',
            handlePrivacyToggle,
            false,
            <Switch
              value={isPrivate}
              onValueChange={handlePrivacyToggle}
              trackColor={{ false: '#666', true: '#FF4B6A' }}
              thumbColor={isPrivate ? '#fff' : '#fff'}
            />
          )}
        </BlurView>

        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          {renderSettingItem('help-circle-outline', 'Help Center', () => router.push('/profile/help'))}
          {renderSettingItem('information-circle-outline', 'About', () => router.push('/profile/about'))}
        </BlurView>

        <BlurView intensity={10} tint="dark" style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, styles.dangerText]}>Account Actions</Text>
          {renderSettingItem(
            'log-out-outline',
            'Logout',
            () => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel'
                  },
                  {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await logout();
                        router.replace('/(auth)/sign-in');
                      } catch (error) {
                        console.error('Logout error:', error);
                        Alert.alert('Error', 'Failed to logout. Please try again.');
                      }
                    }
                  }
                ]
              );
            },
            false,
            <Text style={styles.dangerText}>Logout</Text>
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
  },
  settingText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 15,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dangerSection: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  dangerText: {
    color: '#FF3B30',
  },
});
