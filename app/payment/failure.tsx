import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import CustomButton from '../components/CustomButton';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentFailureScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { orderId, errorMessage } = useLocalSearchParams();

  const handleRetry = () => {
    // Go back to payment screen
    router.back();
  };

  const handleCancel = () => {
    // Navigate to home or profile screen
    router.replace('/(tabs)/profile');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="close-circle" size={100} color="#dc3545" />
        <Text style={styles.title}>Payment Failed</Text>
        <Text style={styles.message}>
          Unfortunately, your payment could not be processed. Please try again or use a different payment method.
        </Text>
        
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
        
        <Text style={styles.infoText}>
          If you continue to experience issues, please contact our support team for assistance.
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <CustomButton
          title="Try Again"
          onPress={handleRetry}
          style={styles.retryButton}
        />
        <CustomButton
          title="Cancel"
          onPress={handleCancel}
          variant="outline"
          style={styles.cancelButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  errorContainer: {
    width: '100%',
    backgroundColor: '#f8d7da',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#721c24',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    padding: 20,
  },
  retryButton: {
    marginBottom: 15,
  },
  cancelButton: {
    borderColor: '#999',
  },
});
