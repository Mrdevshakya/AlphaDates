import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  Animated
} from 'react-native';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SubscriptionService } from '../utils/subscription';
import { SubscriptionPlan, UserSubscription } from '../../src/types';
import CheckoutPage from './CheckoutPage';

const { width } = Dimensions.get('window');

interface SubscriptionPlansProps {
  userId: string;
  visible: boolean;
  onClose: () => void;
  onSubscriptionSuccess: () => void;
}

export default function SubscriptionPlans({
  userId,
  visible,
  onClose,
  onSubscriptionSuccess
}: SubscriptionPlansProps) {
  const [plans] = useState<SubscriptionPlan[]>(SubscriptionService.getSubscriptionPlans());
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // Animation values
  const slideAnim = useState(new Animated.Value(width))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];
  const planAnimations = useState(
    plans.map(() => new Animated.Value(0))
  )[0];

  // Animation effects
  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Stagger plan animations
      const planStaggerAnimations = planAnimations.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          delay: index * 100,
          useNativeDriver: true,
        })
      );
      
      Animated.stagger(100, planStaggerAnimations).start();
      
      loadCurrentSubscription();
    } else {
      // Reset animations
      slideAnim.setValue(width);
      fadeAnim.setValue(0);
      planAnimations.forEach(anim => anim.setValue(0));
    }
  }, [visible]);

  const loadCurrentSubscription = async () => {
    try {
      setLoading(true);
      const subscription = await SubscriptionService.getUserSubscription(userId);
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    setSelectedPlan(null);
    
    // Reload current subscription to reflect the new subscription
    await loadCurrentSubscription();
    
    onSubscriptionSuccess();
    onClose();
  };

  const handlePaymentError = (error: string) => {
    Alert.alert('Payment Failed', error);
    setShowPayment(false);
  };

  const renderPlanCard = (plan: SubscriptionPlan, index: number) => {
    const isCurrentPlan = currentSubscription?.planId === plan.id;
    const monthlyPrice = Math.round(plan.price / plan.duration);

    return (
      <Animated.View
        key={plan.id}
        style={[
          {
            opacity: planAnimations[index],
            transform: [
              {
                translateY: planAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
              {
                scale: planAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.planCard,
            plan.isPopular && styles.popularPlan,
            isCurrentPlan && styles.currentPlan
          ]}
          onPress={() => !isCurrentPlan && handlePlanSelect(plan)}
          disabled={isCurrentPlan}
        >
        {plan.isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.planPrice}>₹{plan.price}</Text>
            <Text style={styles.planPriceSubtext}>₹{monthlyPrice}/month</Text>
          </View>
        </View>

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <MaterialIcons name="check" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {isCurrentPlan ? (
          <View style={styles.currentPlanButton}>
            <Text style={styles.currentPlanButtonText}>Current Plan</Text>
          </View>
        ) : (
          <LinearGradient
            colors={['#FF4B6A', '#FF6B8A']}
            style={styles.selectButton}
          >
            <Text style={styles.selectButtonText}>Choose Plan</Text>
          </LinearGradient>
        )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderCurrentSubscription = () => {
    if (!currentSubscription) return null;

    const plan = plans.find(p => p.id === currentSubscription.planId);
    const endDate = new Date(currentSubscription.endDate);
    const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
      <View style={styles.currentSubscriptionCard}>
        <View style={styles.subscriptionHeader}>
          <MaterialIcons name="star" size={24} color="#FFD700" />
          <Text style={styles.subscriptionTitle}>Active Subscription</Text>
        </View>
        
        <Text style={styles.subscriptionPlan}>{plan?.name} Plan</Text>
        <Text style={styles.subscriptionExpiry}>
          {daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'}
        </Text>
        
        <View style={styles.subscriptionActions}>
          <TouchableOpacity style={styles.manageButton}>
            <Text style={styles.manageButtonText}>Manage</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Subscription Plans</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerContent}>
            <Text style={styles.subtitle}>Unlock Premium Features</Text>
            <Text style={styles.description}>
              Get unlimited access to matches and premium features
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF4B6A" />
            </View>
          ) : (
            <>
              {renderCurrentSubscription()}
              
              <View style={styles.plansContainer}>
                {plans.map((plan, index) => renderPlanCard(plan, index))}
              </View>
            </>
          )}
        </ScrollView>

        {/* Checkout Page */}
        {selectedPlan && (
          <CheckoutPage
            visible={showPayment}
            onClose={() => setShowPayment(false)}
            selectedPlan={selectedPlan}
            userId={userId}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  currentSubscriptionCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 8,
  },
  subscriptionPlan: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 4,
  },
  subscriptionExpiry: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  subscriptionActions: {
    flexDirection: 'row',
  },
  manageButton: {
    backgroundColor: '#FF4B6A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  manageButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  plansContainer: {
    paddingBottom: 30,
  },
  planCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  popularPlan: {
    borderColor: '#FF4B6A',
    position: 'relative',
  },
  currentPlan: {
    borderColor: '#4CAF50',
    opacity: 0.7,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#FF4B6A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4B6A',
  },
  planPriceSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#FFF',
    marginLeft: 8,
    flex: 1,
  },
  selectButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentPlanButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  currentPlanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});