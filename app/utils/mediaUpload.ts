import { db, storage } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Post } from '../../src/types';

export const uploadMedia = async (
  userId: string,
  mediaUri: string,
  mediaType: 'image' | 'video',
  caption: string,
  onProgress?: (progress: number) => void
): Promise<Post> => {
  // Helper to convert Blob to base64 data URL
  const blobToDataURL = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  try {
    console.log('🚀 Starting media upload for URI:', mediaUri);
    console.log('📊 Upload details - User:', userId, 'Type:', mediaType);
    
    // Validate inputs
    if (!userId) {
      throw new Error('User ID is required for upload');
    }
    if (!mediaUri) {
      throw new Error('Media URI is required for upload');
    }
    
    const timestamp = Date.now();
    const fileExtension = mediaType === 'image' ? 'jpg' : 'mp4';
    const filename = `posts/${userId}/${timestamp}.${fileExtension}`;
    const storageRef = ref(storage, filename);

    console.log('📁 Storage path:', filename);

    // Handle file:// URIs by converting to blob and using uploadBytes
    let blob: Blob;
    
    try {
      if (mediaUri.startsWith('file://')) {
        // For file:// URIs, use fetch to get the file as blob
        console.log('🔄 Converting file:// URI to blob...');
        const response = await fetch(mediaUri);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        blob = await response.blob();
      } else {
        // For other URIs (http, https, etc.), fetch directly
        console.log('🔄 Fetching URI as blob...');
        const response = await fetch(mediaUri);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        blob = await response.blob();
      }
      
      console.log('✅ Successfully converted to blob, size:', blob.size, 'bytes');
      
      // Validate blob size
      if (blob.size === 0) {
        throw new Error('File is empty or corrupted');
      }
      
      // Check file size limit (50MB for videos, 10MB for images)
      const maxSize = mediaType === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (blob.size > maxSize) {
        throw new Error(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
      }
      
    } catch (blobError) {
      console.error('❌ Error converting to blob:', blobError);
      throw new Error(`Failed to process media file: ${blobError instanceof Error ? blobError.message : 'Unknown error'}`);
    }
    
    // Set metadata for the file
    const metadata = {
      contentType: mediaType === 'image' ? 'image/jpeg' : 'video/mp4',
      customMetadata: {
        userId: userId,
        uploadedAt: new Date().toISOString(),
        originalUri: mediaUri
      }
    };

    console.log('📤 Uploading to Firebase Storage...');
    
    try {
      // Upload the blob using uploadBytes
      const uploadResult = await uploadBytes(storageRef, blob, metadata);
      console.log('✅ Successfully uploaded to Firebase Storage');
      console.log('📊 Upload result:', uploadResult);
      
      // Update progress
      if (onProgress) {
        onProgress(90);
      }

      // Get download URL
      console.log('🔗 Getting download URL...');
      const downloadURL = await getDownloadURL(storageRef);
      console.log('✅ Got download URL:', downloadURL);
      
      // Final progress update
      if (onProgress) {
        onProgress(100);
      }
      
      // Verify the download URL is accessible
      try {
        const testResponse = await fetch(downloadURL, { method: 'HEAD' });
        if (!testResponse.ok) {
          console.warn('⚠️ Download URL may not be accessible:', testResponse.status);
        } else {
          console.log('✅ Download URL verified as accessible');
        }
      } catch (verifyError) {
        console.warn('⚠️ Could not verify download URL accessibility:', verifyError);
        // Don't fail the upload for this
      }

      // Save to Firestore
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

      console.log('💾 Saving post data to Firestore...');
      const docRef = await addDoc(collection(db, 'posts'), postData);
      console.log('✅ Successfully saved post to Firestore with ID:', docRef.id);

      return {
        id: docRef.id,
        ...postData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Post;
      
    } catch (uploadError) {
      console.error('❌ Error during Firebase Storage upload:', uploadError);
      // Fallback: if image upload fails, save as base64 in Firestore so it still shows to everyone
      if (mediaType === 'image') {
        try {
          console.log('🛟 Falling back to base64 image storage in Firestore...');
          const dataUrl = await blobToDataURL(blob);
          // Save to Firestore with base64 image
          const postData: any = {
            userId,
            imageUrl: null,
            imageBase64: dataUrl, // data:image/jpeg;base64,...
            videoUrl: null,
            caption,
            likes: [],
            comments: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          const docRef = await addDoc(collection(db, 'posts'), postData);
          console.log('✅ Saved base64 image post to Firestore with ID:', docRef.id);
          // Return a Post-like object; consumers should render imageBase64 as fallback
          return {
            id: docRef.id,
            ...postData,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as unknown as Post;
        } catch (fallbackErr) {
          console.error('❌ Fallback to base64 failed:', fallbackErr);
          throw new Error(
            `Firebase Storage upload failed and base64 fallback also failed: ${fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error'}`
          );
        }
      }
      throw new Error(`Firebase Storage upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to upload media: ${errorMessage}`);
  }
};

export default {
  uploadMedia
};
