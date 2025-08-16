import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView, Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { uploadMedia } from '../utils/mediaUpload';

const { height } = Dimensions.get('window');

export default function AddPostScreen() {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const selectImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to post');
      return;
    }

    setUploading(true);
    
    try {
      // Handle file:// URIs properly for Android
      let uploadUri = imageUri;
      if (imageUri.startsWith('file://')) {
        // For file:// URIs, we can use the URI directly as the mediaUpload function handles conversion
        console.log('Uploading file URI:', imageUri);
      }
      
      await uploadMedia(user.uid, uploadUri, 'image', caption);
      Alert.alert('Success', 'Post uploaded successfully!');
      setCaption('');
      setImageUri(null);
      // Navigate back to home or profile
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload failed', `Failed to upload post: ${error.message || 'Please try again'}`);
    } finally {
      setUploading(false);
    }
  };

  // Instagram-style header
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>New Post</Text>
      <TouchableOpacity 
        onPress={handlePost}
        disabled={!imageUri || uploading}
      >
        <Text style={[styles.shareText, (!imageUri || uploading) && styles.disabledShareText]}>
          {uploading ? 'Sharing...' : 'Share'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Instagram-style content
  const renderContent = () => (
    <View style={styles.content}>
      <View style={[styles.mediaSection, { height: height * 0.5 }]}> 
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.selectedImage} />
        ) : (
          <View style={styles.mediaPlaceholder}>
            <Ionicons name="image-outline" size={80} color="#8e8e93" />
            <Text style={styles.placeholderText}>Select an image</Text>
          </View>
        )}
      </View>
      
      <View style={styles.inputSection}>
        <TextInput
          style={styles.captionInput}
          placeholder="Write a caption..."
          placeholderTextColor="#8e8e93"
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={2200}
        />
        <Text style={styles.captionCounter}>{caption.length}/2200</Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.mediaOptions}>
        <TouchableOpacity style={styles.mediaOption} onPress={selectImage}>
          <Ionicons name="images-outline" size={28} color="#FF4B6A" />
          <Text style={styles.mediaOptionText}>Gallery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.mediaOption} onPress={takePhoto}>
          <Ionicons name="camera-outline" size={28} color="#FF4B6A" />
          <Text style={styles.mediaOptionText}>Photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.scrollContainer}>
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#262626',
    backgroundColor: '#000',
    zIndex: 1,
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  shareText: {
    color: '#0095f6',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledShareText: {
    color: '#0095f680',
  },
  content: {
    flex: 1,
  },
  mediaSection: {
    backgroundColor: '#000',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  mediaPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  placeholderText: {
    color: '#8e8e93',
    fontSize: 16,
    marginTop: 10,
  },
  inputSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  captionInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    maxHeight: 100,
  },
  captionCounter: {
    color: '#8e8e93',
    fontSize: 13,
    marginLeft: 8,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#262626',
  },
  mediaOptions: {
    flexDirection: 'row',
    paddingVertical: 16,
    backgroundColor: '#000',
  },
  mediaOption: {
    flex: 1,
    alignItems: 'center',
  },
  mediaOptionText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
});