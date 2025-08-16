import React from 'react';
import { Stack } from 'expo-router';

export default function PaymentLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Payment',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="checkout" 
        options={{ 
          title: 'Checkout',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="success" 
        options={{ 
          title: 'Payment Success',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="failure" 
        options={{ 
          title: 'Payment Failed',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}
