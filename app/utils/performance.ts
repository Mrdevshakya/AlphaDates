import { InteractionManager } from 'react-native';

// Run heavy task after interactions
export const runAfterInteractions = (task: () => void | Promise<void>) => {
  InteractionManager.runAfterInteractions(() => {
    try {
      task();
    } catch (error) {
      console.error('Error running task:', error);
    }
  });
};

// Debounce function to limit the rate at which a function can fire
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function to ensure a function is called at most once in a specified time period
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = func(...args);
      setTimeout(() => (inThrottle = false), limit);
    }
    return lastResult;
  };
};

// Memoize function results
export const memoize = <T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): ((...args: Parameters<T>) => ReturnType<T>) => {
  const cache = new Map<string, ReturnType<T>>();

  return (...args: Parameters<T>) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = func(...args);
    cache.set(key, result);
    return result;
  };
};

// Batch multiple updates
export const batchUpdates = (updates: (() => void)[]) => {
  return new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      updates.forEach((update) => {
        try {
          update();
        } catch (error) {
          console.error('Error in batch update:', error);
        }
      });
      resolve();
    });
  });
};

// Default export for expo-router
export default {
  runAfterInteractions,
  debounce,
  throttle,
  memoize,
  batchUpdates,
}; 