import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from './context/AuthContext';
import { uploadStory } from './utils/stories';
import { uploadMedia } from './utils/mediaUpload';

type MediaType = 'image' | 'video';
type UploadMode = 'post' | 'story';

export default function EditMediaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  
  // Get media data from params
  const mediaUri = params.uri as string;
  const mediaType = params.type as MediaType;
  const uploadMode = params.mode as UploadMode;
  
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  useEffect(() => {
    console.log('EditMediaScreen params:', params);
    console.log('Media URI:', mediaUri);
    console.log('Media Type:', mediaType);
    console.log('Upload Mode:', uploadMode);
    
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => {
      clearTimeout(timer);
      // Clean up temporary files when navigating away
      if (mediaUri && mediaUri.startsWith('file://')) {
        console.log('Cleaning up temporary file:', mediaUri);
        // Note: In a real app, you might want to implement actual file cleanup here
        // For now, we're just logging that cleanup would happen
      }
    };
  }, [params, mediaUri]);
  
  // Cleanup function to remove temporary files when component unmounts
  useEffect(() => {
    console.log('EditMediaScreen params:', params);
    console.log('Media URI:', mediaUri);
    console.log('Media Type:', mediaType);
    console.log('Upload Mode:', uploadMode);
    
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => {
      clearTimeout(timer);
      // Clean up temporary files when navigating away
      if (mediaUri && mediaUri.startsWith('file://')) {
        console.log('Cleaning up temporary file:', mediaUri);
        // Note: In a real app, you might want to implement actual file cleanup here
        // For now, we're just logging that cleanup would happen
      }
    };
  }, [params, mediaUri]);
  
  const handleUpload = async () => {
    if (isUploading) return;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to upload media');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      if (uploadMode === 'story') {
        // Upload to story
        await uploadStory(user.uid, mediaUri, mediaType as 'image' | 'video', (progress) => {
          setUploadProgress(progress);
        });
        Alert.alert('Success', 'Added to your story!');
      } else {
        // Upload to posts
        await uploadMedia(user.uid, mediaUri, mediaType as 'image' | 'video', caption, (progress) => {
          setUploadProgress(progress);
        });
        Alert.alert('Success', 'Posted successfully!');
      }
      
      // Navigate back to home
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', `Failed to upload media: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {uploadMode === 'story' ? 'New Story' : 'New Post'}
        </Text>
        <TouchableOpacity 
          style={[styles.shareButton, isUploading && styles.disabledButton]}
          onPress={handleUpload}
          disabled={isUploading}
        >
          <Text style={styles.shareButtonText}>
            {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Share'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Media Preview */}
      <View style={styles.mediaContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>Loading media...</Text>
          </View>
        ) : mediaType === 'image' ? (
          <Image 
            source={{ uri: mediaUri }} 
            style={styles.media} 
            resizeMode="contain" 
            onLoad={() => console.log('Image loaded successfully')}
            onError={(error) => console.log('Image load error:', error)}
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Ionicons name="play-circle" size={60} color="white" />
            <Text style={styles.videoText}>Video</Text>
            <Text style={styles.videoUri} numberOfLines={1}>{mediaUri}</Text>
          </View>
        )}
      </View>
      
      {/* Caption Input */}
      <ScrollView style={styles.captionContainer}>
        <TextInput
          style={styles.captionInput}
          placeholder="Write a caption..."
          placeholderTextColor="#888"
          value={caption}
          onChangeText={setCaption}
          multiline
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  shareButton: {
    backgroundColor: '#FF4B6A',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  shareButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '80%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  videoText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  videoUri: {
    color: '#888',
    marginTop: 5,
    fontSize: 12,
    maxWidth: '80%',
  },
  captionContainer: {
    maxHeight: 150,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  captionInput: {
    color: 'white',
    fontSize: 16,
    textAlignVertical: 'top',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
});
