import AsyncStorage from '@react-native-async-storage/async-storage';

const storeData = async (key: string, value: any) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(`@chat_${key}`, jsonValue);
  } catch (error) {
    console.error('Error storing data:', error);
  }
};

const getStoredData = async (key: string) => {
  try {
    const jsonValue = await AsyncStorage.getItem(`@chat_${key}`);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error retrieving data:', error);
    return null;
  }
};

const removeStoredData = async (key: string) => {
  try {
    await AsyncStorage.removeItem(`@chat_${key}`);
  } catch (error) {
    console.error('Error removing data:', error);
  }
};

const useOfflineStorage = () => ({
  storeData,
  getStoredData,
  removeStoredData,
});

export default useOfflineStorage; 