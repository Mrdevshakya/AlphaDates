import React, { useEffect } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';

interface ToastProps {
  visible: boolean;
  message: string;
  onHide: () => void;
}

const Toast = ({ visible, message, onHide }: ToastProps) => {
  const opacity = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000), // Show for 2 seconds
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity }
      ]}
    >
      <BlurView intensity={30} tint="dark" style={styles.blur}>
        <Text style={styles.text}>{message}</Text>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
  },
  blur: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default Toast; 