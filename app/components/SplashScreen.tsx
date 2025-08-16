import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#FF6B6B', '#FF8E53']}
      style={styles.container}
    >
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/Alphadate.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.tagline}>Find your perfect match</Text>
        <View style={styles.loadingDots}>
          <Animated.View 
            style={[
              styles.dot,
              { 
                transform: [{ scale: fadeAnim.interpolate({
                  inputRange: [0, 0.33, 0.66, 1],
                  outputRange: [1, 1.5, 1, 1]
                })}]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.dot,
              { 
                transform: [{ scale: fadeAnim.interpolate({
                  inputRange: [0, 0.33, 0.66, 1],
                  outputRange: [1, 1, 1.5, 1]
                })}]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.dot,
              { 
                transform: [{ scale: fadeAnim.interpolate({
                  inputRange: [0, 0.33, 0.66, 1],
                  outputRange: [1, 1, 1, 1.5]
                })}]
              }
            ]} 
          />
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  logoImage: {
    width: 200,
    height: 200,
  },
  tagline: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 50,
    fontStyle: 'italic',
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 8,
  },
});
