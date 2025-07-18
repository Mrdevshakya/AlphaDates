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

export default function PrivacySettings() {
  const { user, userData, setUserData } = useAuth();
  const [isPrivate, setIsPrivate] = useState(userData?.isPrivate || false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(userData?.privacySettings?.showOnlineStatus ?? true);
  const [showLastSeen, setShowLastSeen] = useState(userData?.privacySettings?.showLastSeen ?? true);

  const handleBack = () => {
    router.back();
  };

  const handlePrivacyToggle = async (field: string, value: boolean) => {
    if (!user || !userData) return;

    try {
      let updateData: any = {};
      
      if (field === 'isPrivate') {
        updateData = { isPrivate: value };
      } else {
        updateData = {
          privacySettings: {
            ...userData.privacySettings,
            [field]: value
          }
        };
      }

      await updateDoc(doc(db, 'users', user.uid), updateData);

      setUserData({
        ...userData,
        ...updateData
      });

      switch (field) {
        case 'isPrivate':
          setIsPrivate(value);
          break;
        case 'showOnlineStatus':
          setShowOnlineStatus(value);
          break;
        case 'showLastSeen':
          setShowLastSeen(value);
          break;
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      Alert.alert('Error', 'Failed to update privacy settings');
    }
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    description: string,
    value: boolean,
    onToggle: (value: boolean) => void,
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
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#666', true: '#FF4B6A' }}
        thumbColor={value ? '#fff' : '#fff'}
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
          <Text style={styles.headerTitle}>Privacy Settings</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Account Privacy</Text>
          {renderSettingItem(
            'lock-closed-outline',
            'Private Account',
            'Only approved followers can see your profile and posts',
            isPrivate,
            (value) => handlePrivacyToggle('isPrivate', value)
          )}
          {renderSettingItem(
            'radio-outline',
            'Online Status',
            'Show when you are active on the app',
            showOnlineStatus,
            (value) => handlePrivacyToggle('showOnlineStatus', value)
          )}
          {renderSettingItem(
            'time-outline',
            'Last Seen',
            'Show when you were last active',
            showLastSeen,
            (value) => handlePrivacyToggle('showLastSeen', value)
          )}
        </BlurView>

        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Blocked Users</Text>
          <TouchableOpacity 
            style={styles.blockListButton}
            onPress={() => Alert.alert('Coming soon')}
          >
            <Text style={styles.blockListText}>Manage Blocked Users</Text>
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
  blockListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  blockListText: {
    fontSize: 16,
    color: 'white',
  },
}); 