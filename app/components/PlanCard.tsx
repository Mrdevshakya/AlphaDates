import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SubscriptionPlan } from '../../src/types';

interface PlanCardProps {
  plan: SubscriptionPlan;
  onSelect: (plan: SubscriptionPlan) => void;
  selected: boolean;
  loading: boolean;
}

export default function PlanCard({ plan, onSelect, selected, loading }: PlanCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.selectedCard,
        plan.isPopular && styles.popularCard
      ]}
      onPress={() => onSelect(plan)}
      disabled={loading}
    >
      {plan.isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>POPULAR</Text>
        </View>
      )}
      
      <Text style={styles.planName}>{plan.name}</Text>
      
      <View style={styles.priceContainer}>
        <Text style={styles.price}>₹{plan.price}</Text>
        <Text style={styles.duration}>/{plan.duration} month{plan.duration > 1 ? 's' : ''}</Text>
      </View>
      
      <View style={styles.featuresContainer}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={styles.featureText}>✓ {feature}</Text>
          </View>
        ))}
      </View>
      
      <TouchableOpacity
        style={[
          styles.selectButton,
          selected && styles.selectedButton
        ]}
        onPress={() => onSelect(plan)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>
            {selected ? 'Selected' : 'Select Plan'}
          </Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  selectedCard: {
    borderColor: '#007bff',
    borderWidth: 2,
  },
  popularCard: {
    borderColor: '#ffc107',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#ffc107',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    zIndex: 1,
  },
  popularText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  duration: {
    fontSize: 16,
    color: '#666',
    marginLeft: 5,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    paddingVertical: 5,
  },
  featureText: {
    fontSize: 14,
    color: '#555',
  },
  selectButton: {
    backgroundColor: '#007bff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
