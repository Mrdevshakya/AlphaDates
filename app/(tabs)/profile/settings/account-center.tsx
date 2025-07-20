import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function AccountCenterScreen() {
  const { userData } = useAuth();

  const handleBack = () => {
    router.back();
  };

  const renderInfoItem = (
    icon: string,
    title: string,
    value: string | undefined,
    onPress: () => void,
  ) => (
    <TouchableOpacity style={styles.infoItem} onPress={onPress}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon as any} size={24} color="#FF4B6A" />
        <View style={styles.infoTexts}>
          <Text style={styles.infoTitle}>{title}</Text>
          <Text style={styles.infoValue}>{value || 'Not set'}</Text>
        </View>
      </View>
      <Ionicons name="pencil-outline" size={20} color="#666" />
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
          <Text style={styles.headerTitle}>Account Center</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {renderInfoItem(
            'person-outline',
            'Name',
            userData?.name,
            () => router.push('/profile/edit')
          )}
          {renderInfoItem(
            'at-outline',
            'Username',
            `@${userData?.username}`,
            () => router.push('/profile/edit')
          )}
          {renderInfoItem(
            'mail-outline',
            'Email',
            userData?.email,
            () => router.push('/profile/edit')
          )}
          {renderInfoItem(
            'call-outline',
            'Phone Number',
            userData?.mobileNumber,
            () => router.push('/profile/edit')
          )}
          {renderInfoItem(
            'calendar-outline',
            'Age',
            userData?.age ? `${userData.age} years` : undefined,
            () => router.push('/profile/edit')
          )}
        </BlurView>

        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Details</Text>
          {renderInfoItem(
            'location-outline',
            'Location',
            userData?.location,
            () => router.push('/profile/edit')
          )}
          {renderInfoItem(
            'briefcase-outline',
            'Work',
            userData?.work,
            () => router.push('/profile/edit')
          )}
          {renderInfoItem(
            'school-outline',
            'Education',
            userData?.education,
            () => router.push('/profile/edit')
          )}
          {renderInfoItem(
            'book-outline',
            'Bio',
            userData?.bio,
            () => router.push('/profile/edit')
          )}
        </BlurView>

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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoTexts: {
    marginLeft: 15,
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: 'white',
  },
}); 