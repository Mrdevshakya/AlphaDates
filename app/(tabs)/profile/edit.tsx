import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Toast from '../../components/Toast';
import { Ionicons } from '@expo/vector-icons';

export default function EditProfileScreen() {
  const { user, userData, setUserData } = useAuth();
  const [name, setName] = useState(userData?.name || '');
  const [username, setUsername] = useState(userData?.username || '');
  const [bio, setBio] = useState(userData?.bio || '');
  const [location, setLocation] = useState(userData?.location || '');
  const [age, setAge] = useState(userData?.age?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (age && (isNaN(Number(age)) || Number(age) < 13 || Number(age) > 120)) {
      newErrors.age = 'Please enter a valid age between 13 and 120';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showSuccessToast('Please fix the errors before saving');
      return;
    }

    if (!user || !userData) {
      showSuccessToast('You must be logged in to update your profile');
      return;
    }
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const updates = {
        name: name.trim(),
        username: username.trim(),
        bio: bio.trim(),
        location: location.trim(),
        age: age ? parseInt(age) : undefined,
        updatedAt: new Date(),
        following: userData.following || [],
        followers: userData.followers || [],
      };

      await updateDoc(userRef, updates);
      
      setUserData({
        ...userData,
        ...updates,
        id: user.uid,
      });
      
      showSuccessToast('Profile updated successfully');
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      showSuccessToast('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        // Handle image upload to storage and update profile picture URL
        Alert.alert('Coming Soon', 'Image upload will be implemented soon!');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const renderInputField = (
    label: string,
    value: string,
    setValue: (text: string) => void,
    options: {
      placeholder?: string;
      multiline?: boolean;
      keyboardType?: 'default' | 'numeric';
      error?: string;
      icon?: string;
    } = {}
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[
        styles.inputWrapper,
        options.error ? styles.inputError : null,
        options.multiline ? styles.multilineWrapper : null
      ]}>
        {options.icon && (
          <Ionicons name={options.icon as any} size={20} color="#666" style={styles.inputIcon} />
        )}
        <TextInput
          style={[
            styles.input,
            options.multiline ? styles.multilineInput : null
          ]}
          value={value}
          onChangeText={setValue}
          placeholder={options.placeholder}
          placeholderTextColor="#666"
          multiline={options.multiline}
          keyboardType={options.keyboardType}
        />
      </View>
      {options.error && (
        <Text style={styles.errorText}>{options.error}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>

        
        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper}>
            <Image
              source={{
                uri: userData?.profilePicture ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
              }}
              style={styles.profileImage}
            />
            <TouchableOpacity 
              style={styles.changePhotoButton} 
              onPress={handlePickImage}
            >
              <Ionicons name="camera" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            {renderInputField('Name', name, setName, {
              placeholder: 'Your name',
              error: errors.name,
              icon: 'person-outline'
            })}
            {renderInputField('Username', username, setUsername, {
              placeholder: 'Your username',
              error: errors.username,
              icon: 'at-outline'
            })}
            {renderInputField('Age', age, setAge, {
              placeholder: 'Your age',
              keyboardType: 'numeric',
              error: errors.age,
              icon: 'calendar-outline'
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About You</Text>
            {renderInputField('Bio', bio, setBio, {
              placeholder: 'Tell us about yourself',
              multiline: true,
              icon: 'book-outline'
            })}
            {renderInputField('Location', location, setLocation, {
              placeholder: 'Your location',
              icon: 'location-outline'
            })}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" style={styles.saveButtonIcon} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <Toast 
        visible={showToast}
        message={toastMessage}
        onHide={() => setShowToast(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#0095F6',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0095F6',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#121212',
  },
  form: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  multilineWrapper: {
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginLeft: 12,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#0095F6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 