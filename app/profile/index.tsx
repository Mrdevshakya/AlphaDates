import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = () => {
  return (
    <View>
      <Ionicons 
        name="heart-outline"
        size={24} 
        color="#FF4B6A" 
      />
    </View>
  );
};

export default ProfileScreen;