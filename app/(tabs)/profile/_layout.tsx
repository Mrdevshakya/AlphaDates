import React from 'react';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: 'Edit Profile',
          headerRight: () => (
            <TouchableOpacity>
              <Ionicons name="checkmark" size={24} color="#FF4B6A" />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
