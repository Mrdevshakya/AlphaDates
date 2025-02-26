import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { Link } from 'expo-router';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1516195851888-6f1a981a862e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1440&q=80' }}
      style={styles.background}
    >
      <BlurView intensity={20} style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.logo}>Amity</Text>
          <Text style={styles.tagline}>Find your perfect match</Text>
          
          <View style={styles.buttonContainer}>
            <Link href="/auth/signin" asChild>
              <TouchableOpacity style={[styles.button, styles.signInButton]}>
                <Text style={styles.buttonText}>Sign In</Text>
              </TouchableOpacity>
            </Link>
            
            <Link href="/auth/signup" asChild>
              <TouchableOpacity style={[styles.button, styles.signUpButton]}>
                <Text style={[styles.buttonText, styles.signUpText]}>Create Account</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: width,
    height: height,
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 30,
    paddingBottom: 50,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 50,
    opacity: 0.9,
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  signInButton: {
    backgroundColor: '#FF4B6F',
  },
  signUpButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'white',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpText: {
    color: 'white',
  },
});
