import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import CustomButton from '../components/CustomButton';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { orderId, amount } = useLocalSearchParams();

  const handleContinue = () => {
    // Navigate to home or profile screen
    router.replace('/(tabs)/profile');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="checkmark-circle" size={100} color="#28a745" />
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.message}>
          Thank you for your subscription. Your payment of ₹{amount} has been processed successfully.
        </Text>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID:</Text>
            <Text style={styles.detailValue}>{orderId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>₹{amount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={styles.detailValueSuccess}>Completed</Text>
          </View>
        </View>
        
        <Text style={styles.infoText}>
          Your subscription is now active and you can enjoy all premium features.
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <CustomButton
          title="Continue to Profile"
          onPress={handleContinue}
          style={styles.button}
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
  detailsContainer: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  detailValueSuccess: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: '500',
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
  button: {
    width: '100%',
  },
});
