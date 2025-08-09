import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';
import { Post } from '../../src/types';

export const uploadMedia = async (
  userId: string,
  mediaUri: string,
  mediaType: 'image' | 'video',
  caption: string,
  onProgress?: (progress: number) => void
): Promise<Post> => {
  try {
    const timestamp = Date.now();
    const fileExtension = mediaType === 'image' ? 'jpg' : 'mp4';
    const filename = `posts/${userId}/${timestamp}.${fileExtension}`;
    const storageRef = ref(storage, filename);

    // Handle file:// URIs by converting to blob and using uploadBytes
    let blob: Blob;
    
    if (mediaUri.startsWith('file://')) {
      // For file:// URIs, use fetch to get the file as blob
      const response = await fetch(mediaUri);
      blob = await response.blob();
    } else {
      // For other URIs (http, https, etc.), fetch directly
      const response = await fetch(mediaUri);
      blob = await response.blob();
    }
    
    // Set metadata for the file
    const metadata = {
      contentType: mediaType === 'image' ? 'image/jpeg' : 'video/mp4',
    };

    // Upload the blob using uploadBytes
    await uploadBytes(storageRef, blob, metadata);

    if (onProgress) onProgress(100);

    const downloadURL = await getDownloadURL(storageRef);

    const postData = {
      userId,
      imageUrl: mediaType === 'image' ? downloadURL : null,
      videoUrl: mediaType === 'video' ? downloadURL : null,
      caption,
      likes: [],
      comments: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'posts'), postData);

    return {
      id: docRef.id,
      ...postData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Post;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};
