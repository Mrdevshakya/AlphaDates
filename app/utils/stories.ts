import { storage, db } from '../config/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Story } from '../../src/types';
import * as ImagePicker from 'expo-image-picker';

export const pickStoryMedia = async () => {
  // Request permissions
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access media library was denied');
  }

  // Pick media
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: true,
    quality: 0.8,
    videoMaxDuration: 15, // 15 seconds max for stories
  });

  if (!result.canceled) {
    return result.assets[0];
  }
  return null;
};

export const uploadStory = async (
  userId: string,
  mediaUri: string,
  mediaType: 'image' | 'video',
  onProgress?: (progress: number) => void
): Promise<Story> => {
  try {
    // Create a unique filename
    const timestamp = new Date().getTime();
    const fileExtension = mediaUri.split('.').pop();
    const filename = `stories/${userId}/${timestamp}.${fileExtension}`;
    const storageRef = ref(storage, filename);

    // Fetch the media as blob
    const response = await fetch(mediaUri);
    const blob = await response.blob();

    // Upload to Firebase Storage
    const uploadTask = uploadBytesResumable(storageRef, blob);

    // Monitor upload progress
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // Create story document in Firestore
            const storyData = {
              userId,
              mediaUrl: downloadURL,
              type: mediaType,
              createdAt: serverTimestamp(),
              seenBy: [],
              duration: mediaType === 'video' ? 15 : 5, // 15s for videos, 5s for images
            };

            const docRef = await addDoc(collection(db, 'stories'), storyData);

            resolve({
              id: docRef.id,
              ...storyData,
              createdAt: new Date(),
            } as Story);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    throw error;
  }
};

const StoryUtils = {
  pickStoryMedia,
  uploadStory,
};

export default StoryUtils; 