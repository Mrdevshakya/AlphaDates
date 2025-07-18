import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';
import { UserProfile } from '../../../src/types';

export default function EditProfileScreen() {
  const { user, userData, updateUserProfile } = useAuth();
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: userData?.name || '',
    bio: userData?.bio || '',
    location: userData?.location || '',
    age: userData?.age || undefined,
    interests: userData?.interests || [],
    education: userData?.education || '',
    work: userData?.work || '',
    height: userData?.height || '',
    zodiac: userData?.zodiac || '',
    drinking: userData?.drinking || '',
    smoking: userData?.smoking || '',
    lookingFor: userData?.lookingFor || '',
    children: userData?.children || '',
    pets: userData?.pets || '',
    personality: userData?.personality || [],
    languages: userData?.languages || [],
    photos: userData?.photos || [],
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userData) {
      setFormData({
        ...userData,
        interests: userData.interests || [],
        personality: userData.personality || [],
        languages: userData.languages || [],
        photos: userData.photos || [],
      });
    }
  }, [userData]);

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please log in to edit your profile</Text>
      </View>
    );
  }

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayInput = (field: keyof UserProfile, value: string) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item !== '');
    setFormData(prev => ({
      ...prev,
      [field]: array
    }));
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        
        const storageRef = ref(storage, `users/${user.uid}/photos/${Date.now()}`);
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        
        const newPhotos = [...(formData.photos || []), downloadURL];
        handleInputChange('photos', newPhotos);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await updateUserProfile(formData);
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handleImagePick} style={styles.avatar}>
          {formData.photos && formData.photos.length > 0 ? (
            <Image source={{ uri: formData.photos[0] }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{formData.name?.[0]}</Text>
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={20} color="white" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Your name"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.bio}
              onChangeText={(value) => handleInputChange('bio', value)}
              placeholder="Write something about yourself"
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(value) => handleInputChange('location', value)}
              placeholder="Your location"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={formData.age?.toString()}
              onChangeText={(value) => handleInputChange('age', parseInt(value) || undefined)}
              placeholder="Your age"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Education</Text>
            <TextInput
              style={styles.input}
              value={formData.education}
              onChangeText={(value) => handleInputChange('education', value)}
              placeholder="Your education"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Work</Text>
            <TextInput
              style={styles.input}
              value={formData.work}
              onChangeText={(value) => handleInputChange('work', value)}
              placeholder="Your work"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Height</Text>
            <TextInput
              style={styles.input}
              value={formData.height}
              onChangeText={(value) => handleInputChange('height', value)}
              placeholder="Your height"
              placeholderTextColor="#666"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences & Lifestyle</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Interests (comma separated)</Text>
            <TextInput
              style={styles.input}
              value={formData.interests?.join(', ')}
              onChangeText={(value) => handleArrayInput('interests', value)}
              placeholder="Travel, Music, Sports..."
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Languages (comma separated)</Text>
            <TextInput
              style={styles.input}
              value={formData.languages?.join(', ')}
              onChangeText={(value) => handleArrayInput('languages', value)}
              placeholder="English, Spanish..."
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Personality Traits (comma separated)</Text>
            <TextInput
              style={styles.input}
              value={formData.personality?.join(', ')}
              onChangeText={(value) => handleArrayInput('personality', value)}
              placeholder="Outgoing, Creative..."
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Zodiac Sign</Text>
            <TextInput
              style={styles.input}
              value={formData.zodiac}
              onChangeText={(value) => handleInputChange('zodiac', value)}
              placeholder="Your zodiac sign"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Drinking</Text>
            <TextInput
              style={styles.input}
              value={formData.drinking}
              onChangeText={(value) => handleInputChange('drinking', value)}
              placeholder="Your drinking habits"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Smoking</Text>
            <TextInput
              style={styles.input}
              value={formData.smoking}
              onChangeText={(value) => handleInputChange('smoking', value)}
              placeholder="Your smoking habits"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Looking For</Text>
            <TextInput
              style={styles.input}
              value={formData.lookingFor}
              onChangeText={(value) => handleInputChange('lookingFor', value)}
              placeholder="What are you looking for?"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Children</Text>
            <TextInput
              style={styles.input}
              value={formData.children}
              onChangeText={(value) => handleInputChange('children', value)}
              placeholder="Your status regarding children"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pets</Text>
            <TextInput
              style={styles.input}
              value={formData.pets}
              onChangeText={(value) => handleInputChange('pets', value)}
              placeholder="Your status regarding pets"
              placeholderTextColor="#666"
            />
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleSave}
          disabled={isLoading}
          style={styles.saveButtonContainer}
        >
          <LinearGradient
            colors={['#FF4B6A', '#FF8C9F']}
            style={styles.saveButton}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF4B6A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF4B6A',
    padding: 8,
    borderRadius: 15,
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  saveButtonContainer: {
    marginTop: 32,
    marginBottom: 48,
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});
