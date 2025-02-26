import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider } from './context/AuthContext';

const { width, height } = Dimensions.get('window');

type IconName = 
  | 'heart-outline'
  | 'chatbubbles-outline'
  | 'shield-checkmark-outline'
  | 'filter-outline'
  | 'infinite-outline'
  | 'school-outline'
  | 'briefcase-outline'
  | 'body-outline'
  | 'star-outline'
  | 'wine-outline'
  | 'leaf-outline'
  | 'people-outline'
  | 'paw-outline'
  | 'image-outline';

type Feature = {
  icon: IconName;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    icon: 'heart-outline',
    title: 'Perfect Match',
    description: 'Find your ideal partner with our smart matching system',
  },
  {
    icon: 'chatbubbles-outline',
    title: 'Meaningful Chats',
    description: 'Connect through genuine conversations',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Safe & Secure',
    description: 'Your privacy and security are our top priority',
  },
];

function App() {
  return (
    <AuthProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#1a1a1a', '#2d1f3f', '#1a1a1a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#FF4B6A', '#FF8C9F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoBackground}
              >
                <Ionicons name="heart-outline" size={48} color="#FF4B6A" />
              </LinearGradient>
              <View style={styles.titleContainer}>
                <Text style={styles.appName}>AFNNY</Text>
                <Text style={styles.tagline}>Always finding new nexus for you</Text>
              </View>
            </View>

            <View style={styles.featuresContainer}>
              {FEATURES.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <LinearGradient
                    colors={['#FF4B6A', '#FF8C9F']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.featureIconBackground}
                  >
                    <Ionicons name={feature.icon} size={24} color="white" />
                  </LinearGradient>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.buttonContainer}>
              <Link href="/sign-up" asChild>
                <TouchableOpacity>
                  <LinearGradient
                    colors={['#FF4B6A', '#FF8C9F']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.signUpText}>Get Started</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Link>
              
              <Link href="/sign-in" asChild>
                <TouchableOpacity style={styles.signInButton}>
                  <Text style={styles.signInText}>I already have an account</Text>
                </TouchableOpacity>
              </Link>
            </View>

            <View style={styles.termsContainer}>
              <Text style={styles.terms}>
                By continuing, you agree to our Terms & Privacy Policy
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  gradient: {
    flex: 1,
    width: width,
    height: height,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.1,
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4B6A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
  },
  featuresContainer: {
    marginTop: height * 0.08,
    gap: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 16,
    marginTop: height * 0.08,
  },
  gradientButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  signInButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  signInText: {
    color: 'white',
    fontSize: 16,
  },
  termsContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  terms: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default App;
