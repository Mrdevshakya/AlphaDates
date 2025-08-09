import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CameraMode = 'post' | 'story' | 'video';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [mode, setMode] = useState<CameraMode>('post');
  const [isRecording, setIsRecording] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  function toggleFlash() {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  }

  async function takePicture() {
    if (cameraRef.current) {
      try {
        if (mode === 'story') {
          // Story mode: take photo (single tap)
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.8,
            skipProcessing: true,
          });
          console.log('Story photo taken:', photo);
          // Copy the photo to a persistent location
          const filename = photo.uri.split('/').pop();
          const newPath = `${FileSystem.documentDirectory}${filename}`;
          await FileSystem.copyAsync({
            from: photo.uri,
            to: newPath
          });
          // Navigate to edit screen with the persistent URI
          router.push({
            pathname: '/edit-media',
            params: { uri: newPath, type: 'image', mode: 'story' }
          });
        } else if (mode === 'post') {
          // Post mode: take photo
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.8,
            skipProcessing: true,
          });
          console.log('Post photo taken:', photo);
          // Copy the photo to a persistent location
          const filename = photo.uri.split('/').pop();
          const newPath = `${FileSystem.documentDirectory}${filename}`;
          await FileSystem.copyAsync({
            from: photo.uri,
            to: newPath
          });
          // Navigate to edit screen with the persistent URI
          router.push({
            pathname: '/edit-media',
            params: { uri: newPath, type: 'image', mode: 'post' }
          });
        } else if (mode === 'video') {
          // Video mode: start/stop recording
          if (!isRecording) {
            // Start recording
            const promise = cameraRef.current.recordAsync({
              maxDuration: 30,
              quality: '720p',
            });
            
            if (promise) {
              setIsRecording(true);
              const video = await promise;
              console.log('Video recorded:', video);
              setIsRecording(false);
              // Copy the video to a persistent location
              const filename = video.uri.split('/').pop();
              const newPath = `${FileSystem.documentDirectory}${filename}`;
              await FileSystem.copyAsync({
                from: video.uri,
                to: newPath
              });
              // Navigate to edit screen with the persistent URI
              router.push({
                pathname: '/edit-media',
                params: { uri: newPath, type: 'video', mode: 'post' }
              });
            }
          } else {
            // Stop recording
            cameraRef.current.stopRecording();
          }
        }
      } catch (error) {
        console.error('Error taking picture/recording video:', error);
        Alert.alert('Error', 'Failed to capture media');
        setIsRecording(false);
      }
    }
  }

  async function startStoryVideoRecording() {
    if (cameraRef.current && mode === 'story') {
      try {
        // Start recording for story (15-30 seconds)
        const promise = cameraRef.current.recordAsync({
          maxDuration: 30,
          quality: '720p',
        });
        
        if (promise) {
          setIsRecording(true);
          const video = await promise;
          console.log('Story video recorded:', video);
          setIsRecording(false);
          // Copy the video to a persistent location
          const filename = video.uri.split('/').pop();
          const newPath = `${FileSystem.documentDirectory}${filename}`;
          await FileSystem.copyAsync({
            from: video.uri,
            to: newPath
          });
          // Navigate to edit screen with the persistent URI
          router.push({
            pathname: '/edit-media',
            params: { uri: newPath, type: 'video', mode: 'story' }
          });
        }
      } catch (error) {
        console.error('Error recording story video:', error);
        Alert.alert('Error', 'Failed to record story video');
        setIsRecording(false);
      }
    }
  }

  async function pickFromGallery() {
    // Request gallery permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Permission to access gallery is required!');
      return;
    }
    
    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mode === 'video' || mode === 'post' ? 
        ImagePicker.MediaTypeOptions.All : 
        ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    
    if (!result.canceled) {
      console.log('Selected media:', result.assets[0]);
      
      if (mode === 'story') {
        // For story, only images are allowed
        if (result.assets[0].type === 'image') {
          // Navigate to edit screen instead of direct upload
          router.push({
            pathname: '/edit-media',
            params: { uri: result.assets[0].uri, type: 'image', mode: 'story' }
          });
        } else {
          Alert.alert('Error', 'Only images can be added to stories');
        }
      } else if (mode === 'post') {
        // For post, both images and videos are allowed
        // Navigate to edit screen instead of direct upload
        router.push({
          pathname: '/edit-media',
          params: { uri: result.assets[0].uri, type: result.assets[0].type, mode: 'post' }
        });
      } else if (mode === 'video') {
        // For video mode, only videos are allowed
        if (result.assets[0].type === 'video') {
          // Navigate to edit screen instead of direct upload
          router.push({
            pathname: '/edit-media',
            params: { uri: result.assets[0].uri, type: 'video', mode: 'post' }
          });
        } else {
          Alert.alert('Error', 'Please select a video');
        }
      }
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        flash={flash}
        ref={cameraRef}
      >
        <View style={[styles.controlsContainer, { paddingTop: insets.top }]}>
          {/* Top controls */}
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.controlButton} onPress={() => router.back()}>
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
              <Ionicons 
                name={flash === 'on' ? 'flash' : 'flash-off'} 
                size={30} 
                color="white" 
              />
            </TouchableOpacity>
          </View>

          {/* Bottom controls */}
          <View style={styles.bottomSection}>
            <View style={styles.bottomControls}>
              <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
                <Ionicons name="camera-reverse" size={30} color="white" />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <TouchableOpacity 
                  style={styles.captureButton} 
                  onPress={takePicture}
                  onLongPress={startStoryVideoRecording}
                  delayLongPress={500}
                >
                  <View style={[styles.captureInner, isRecording && styles.recordingInner]} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.controlButton} onPress={pickFromGallery}>
                <Ionicons name="images" size={30} color="white" />
              </TouchableOpacity>
            </View>
            
            {/* Camera mode options */}
            {/* Camera mode options */}
            <View style={styles.modeOptions}>
              <TouchableOpacity 
                style={[styles.modeButton, mode === 'post' && styles.activeModeButton]}
                onPress={() => setMode('post')}
              >
                <Text style={[styles.modeText, mode === 'post' && styles.activeModeText]}>Post</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modeButton, mode === 'story' && styles.activeModeButton]}
                onPress={() => setMode('story')}
              >
                <Text style={[styles.modeText, mode === 'story' && styles.activeModeText]}>Story</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modeButton, mode === 'video' && styles.activeModeButton]}
                onPress={() => setMode('video')}
              >
                <Text style={[styles.modeText, mode === 'video' && styles.activeModeText]}>Video</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 20,
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#FF4B6A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  bottomSection: {
    paddingBottom: 40,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modeOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'white',
  },
  activeModeButton: {
    backgroundColor: 'white',
  },
  modeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeModeText: {
    color: 'black',
  },
  controlButton: {
    padding: 10,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  recordingInner: {
    width: 40,
    height: 40,
    borderRadius: 5,
    backgroundColor: 'red',
  },
  spacer: {
    width: 50,
  },
});
