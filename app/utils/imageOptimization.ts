import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IMAGE_CACHE_KEY = '@image_cache';
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  uri: string;
  timestamp: number;
  size: number;
}

// Initialize cache directory
const initializeCache = async () => {
  try {
    const cacheDir = `${FileSystem.cacheDirectory}images/`;
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
    }
    return cacheDir;
  } catch (error) {
    console.error('Error initializing cache directory:', error);
    throw error;
  }
};

// Get cache info from AsyncStorage
const getCacheInfo = async (): Promise<Record<string, CacheEntry>> => {
  try {
    const cacheInfo = await AsyncStorage.getItem(IMAGE_CACHE_KEY);
    return cacheInfo ? JSON.parse(cacheInfo) : {};
  } catch (error) {
    console.error('Error getting cache info:', error);
    return {};
  }
};

// Save cache info to AsyncStorage
const saveCacheInfo = async (cacheInfo: Record<string, CacheEntry>) => {
  try {
    await AsyncStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cacheInfo));
  } catch (error) {
    console.error('Error saving cache info:', error);
  }
};

// Clean old cache entries
const cleanCache = async () => {
  try {
    const cacheInfo = await getCacheInfo();
    const now = Date.now();
    let totalSize = 0;
    const entries = Object.entries(cacheInfo);

    // Sort by timestamp (oldest first)
    entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);

    for (const [key, entry] of entries) {
      // Remove old entries
      if (now - entry.timestamp > MAX_CACHE_AGE) {
        await FileSystem.deleteAsync(entry.uri, { idempotent: true });
        delete cacheInfo[key];
        continue;
      }

      totalSize += entry.size;

      // Remove entries if total size exceeds max cache size
      if (totalSize > MAX_CACHE_SIZE) {
        await FileSystem.deleteAsync(entry.uri, { idempotent: true });
        delete cacheInfo[key];
      }
    }

    await saveCacheInfo(cacheInfo);
  } catch (error) {
    console.error('Error cleaning cache:', error);
  }
};

// Optimize image for upload
export const optimizeImage = async (uri: string, options?: {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}): Promise<string> => {
  try {
    const { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = options || {};

    // Get image info
    const imageInfo = await FileSystem.getInfoAsync(uri);
    if (!imageInfo.exists) {
      throw new Error('Image file does not exist');
    }

    // Optimize image
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth, height: maxHeight } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );

    return result.uri;
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw error;
  }
};

// Download and cache image
export const getCachedImage = async (url: string): Promise<string> => {
  try {
    if (!url) throw new Error('No URL provided');

    // For local files, return as is
    if (url.startsWith('file://') || url.startsWith('data:')) {
      return url;
    }

    const cacheDir = await initializeCache();
    const filename = url.split('/').pop() || Date.now().toString();
    const cacheFilePath = `${cacheDir}${filename}`;

    // Check if image is already cached
    const cacheInfo = await getCacheInfo();
    const cachedEntry = cacheInfo[url];

    if (cachedEntry) {
      const fileInfo = await FileSystem.getInfoAsync(cachedEntry.uri);
      if (fileInfo.exists) {
        return cachedEntry.uri;
      }
    }

    // Download and cache image
    const downloadResult = await FileSystem.downloadAsync(url, cacheFilePath);
    const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);

    // Update cache info
    cacheInfo[url] = {
      uri: downloadResult.uri,
      timestamp: Date.now(),
      size: fileInfo.size || 0,
    };
    await saveCacheInfo(cacheInfo);

    // Clean cache in background
    cleanCache().catch(console.error);

    return downloadResult.uri;
  } catch (error) {
    console.error('Error caching image:', error);
    return url; // Fallback to original URL
  }
};

// Clear image cache
export const clearImageCache = async () => {
  try {
    const cacheDir = `${FileSystem.cacheDirectory}images/`;
    await FileSystem.deleteAsync(cacheDir, { idempotent: true });
    await AsyncStorage.removeItem(IMAGE_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing image cache:', error);
    throw error;
  }
};

// Get total cache size
export const getCacheSize = async (): Promise<number> => {
  try {
    const cacheInfo = await getCacheInfo();
    return Object.values(cacheInfo).reduce((total, entry) => total + entry.size, 0);
  } catch (error) {
    console.error('Error getting cache size:', error);
    return 0;
  }
};

// Default export for expo-router
export default {
  optimizeImage,
  getCachedImage,
  clearImageCache,
  getCacheSize,
}; 