import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SubscriptionService } from '../utils/subscription';
import { SUBSCRIPTION_PLANS } from '../utils/subscription';
import { useAuth } from '../context/AuthContext';
import PlanCard from '../components/PlanCard';

export default function PaymentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleSelectPlan = async (plan) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to continue');
      return;
    }

    try {
      setLoading(true);
      setSelectedPlan(plan);
      
      // Navigate to checkout screen with selected plan
      router.push({
        pathname: '/payment/checkout',
        params: { 
          planId: plan.id,
          planName: plan.name,
          planPrice: plan.price.toString(),
          planDuration: plan.duration.toString()
        }
      });
    } catch (error) {
      console.error('Error selecting plan:', error);
      Alert.alert('Error', 'Failed to select plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Plan</Text>
        <Text style={styles.subtitle}>Get premium features to enhance your experience</Text>
      </View>
      
      <View style={styles.plansContainer}>
        {SUBSCRIPTION_PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onSelect={handleSelectPlan}
            selected={selectedPlan?.id === plan.id}
            loading={loading && selectedPlan?.id === plan.id}
          />
        ))}
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By subscribing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  plansContainer: {
    padding: 20,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
