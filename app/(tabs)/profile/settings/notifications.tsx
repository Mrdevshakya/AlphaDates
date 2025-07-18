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

export default function NotificationSettings() {
  const { user, userData, setUserData } = useAuth();
  const [notifications, setNotifications] = useState({
    likes: userData?.notificationSettings?.likes ?? true,
    comments: userData?.notificationSettings?.comments ?? true,
    follows: userData?.notificationSettings?.follows ?? true,
    messages: userData?.notificationSettings?.messages ?? true,
    matchUpdates: userData?.notificationSettings?.matchUpdates ?? true,
    appUpdates: userData?.notificationSettings?.appUpdates ?? true,
  });

  const handleBack = () => {
    router.back();
  };

  const handleNotificationToggle = async (field: string, value: boolean) => {
    if (!user || !userData) return;

    try {
      const updatedSettings = {
        ...notifications,
        [field]: value,
      };

      await updateDoc(doc(db, 'users', user.uid), {
        notificationSettings: updatedSettings,
      });

      setNotifications(updatedSettings);
      setUserData({
        ...userData,
        notificationSettings: updatedSettings,
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    description: string,
    field: string,
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color="#FF4B6A" />
        <View style={styles.settingTexts}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={notifications[field as keyof typeof notifications]}
        onValueChange={(value) => handleNotificationToggle(field, value)}
        trackColor={{ false: '#666', true: '#FF4B6A' }}
        thumbColor={notifications[field as keyof typeof notifications] ? '#fff' : '#fff'}
      />
    </View>
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
          <Text style={styles.headerTitle}>Notification Settings</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Interactions</Text>
          {renderSettingItem(
            'heart-outline',
            'Likes',
            'When someone likes your post',
            'likes'
          )}
          {renderSettingItem(
            'chatbubble-outline',
            'Comments',
            'When someone comments on your post',
            'comments'
          )}
          {renderSettingItem(
            'person-add-outline',
            'Follows',
            'When someone follows you',
            'follows'
          )}
        </BlurView>

        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Messages & Matches</Text>
          {renderSettingItem(
            'mail-outline',
            'Messages',
            'When you receive new messages',
            'messages'
          )}
          {renderSettingItem(
            'heart-half-outline',
            'Match Updates',
            'Updates about your matches',
            'matchUpdates'
          )}
        </BlurView>

        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Other</Text>
          {renderSettingItem(
            'information-circle-outline',
            'App Updates',
            'News and updates about the app',
            'appUpdates'
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