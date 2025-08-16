import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

type ButtonVariant = 'primary' | 'outline' | 'danger';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function CustomButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: CustomButtonProps) {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, style];
    
    if (disabled || loading) {
      return [...baseStyle, styles.disabledButton];
    }
    
    switch (variant) {
      case 'outline':
        return [...baseStyle, styles.outlineButton];
      case 'danger':
        return [...baseStyle, styles.dangerButton];
      default:
        return [...baseStyle, styles.primaryButton];
    }
  };
  
  const getTextStyle = () => {
    const baseTextStyle = [styles.buttonText];
    
    if (disabled || loading) {
      return [...baseTextStyle, styles.disabledText];
    }
    
    switch (variant) {
      case 'outline':
        return [...baseTextStyle, styles.outlineText];
      case 'danger':
        return [...baseTextStyle, styles.dangerText];
      default:
        return [...baseTextStyle, styles.primaryText];
    }
  };
  
  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? '#007bff' : '#fff'} 
          size="small" 
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryButton: {
    backgroundColor: '#007bff',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007bff',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#fff',
  },
  outlineText: {
    color: '#007bff',
  },
  dangerText: {
    color: '#fff',
  },
  disabledText: {
    color: '#6c757d',
  },
});
