import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function AboutUsScreen() {
  const handleBack = () => {
    router.back();
  };

  const handleWebsitePress = () => {
    Linking.openURL('https://alphadate.com');
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:info@alphadate.com');
  };

  const handleSocialPress = (platform: string) => {
    const urls = {
      instagram: 'https://instagram.com/alphadate',
      twitter: 'https://twitter.com/alphadate',
      facebook: 'https://facebook.com/alphadate',
      linkedin: 'https://linkedin.com/company/alphadate',
    };
    Linking.openURL(urls[platform as keyof typeof urls]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FF4B6A', '#FF8C9F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About Us</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo and Brand */}
        <BlurView intensity={10} tint="dark" style={styles.section}>
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>AlphaDate</Text>
            </View>
            <Text style={styles.tagline}>Find Your Perfect Match</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
          </View>
        </BlurView>

        {/* Our Story */}
        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Our Story</Text>
          <Text style={styles.sectionText}>
            AlphaDate was founded with a simple mission: to help people find meaningful 
            connections in the digital age. We believe that everyone deserves to find love, 
            companionship, and genuine relationships.
          </Text>
          <Text style={styles.sectionText}>
            Our team of passionate developers, designers, and relationship experts work 
            tirelessly to create a safe, inclusive, and effective platform for modern dating. 
            We use advanced algorithms and user preferences to help you discover compatible 
            matches while maintaining your privacy and security.
          </Text>
        </BlurView>

        {/* Our Mission */}
        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.sectionText}>
            To revolutionize online dating by creating authentic connections through 
            innovative technology, thoughtful design, and a commitment to user safety 
            and satisfaction.
          </Text>
          
          <View style={styles.missionPoints}>
            <View style={styles.missionPoint}>
              <Ionicons name="heart" size={20} color="#FF4B6A" />
              <Text style={styles.missionPointText}>Foster genuine relationships</Text>
            </View>
            <View style={styles.missionPoint}>
              <Ionicons name="shield-checkmark" size={20} color="#FF4B6A" />
              <Text style={styles.missionPointText}>Ensure user safety and privacy</Text>
            </View>
            <View style={styles.missionPoint}>
              <Ionicons name="people" size={20} color="#FF4B6A" />
              <Text style={styles.missionPointText}>Build an inclusive community</Text>
            </View>
            <View style={styles.missionPoint}>
              <Ionicons name="trending-up" size={20} color="#FF4B6A" />
              <Text style={styles.missionPointText}>Continuously innovate and improve</Text>
            </View>
          </View>
        </BlurView>

        {/* Key Features */}
        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>What Makes Us Different</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="sparkles" size={24} color="#FFD700" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Smart Matching</Text>
              <Text style={styles.featureDescription}>
                Advanced algorithms that learn your preferences and suggest compatible matches
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="lock-closed" size={24} color="#4CAF50" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Privacy First</Text>
              <Text style={styles.featureDescription}>
                Your data is encrypted and protected. You control what you share and with whom
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#2196F3" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Verified Profiles</Text>
              <Text style={styles.featureDescription}>
                Photo verification and profile moderation to ensure authentic connections
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="headset" size={24} color="#FF4B6A" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>24/7 Support</Text>
              <Text style={styles.featureDescription}>
                Our dedicated support team is always here to help you with any questions
              </Text>
            </View>
          </View>
        </BlurView>

        {/* Contact Information */}
        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          
          <TouchableOpacity style={styles.contactItem} onPress={handleWebsitePress}>
            <Ionicons name="globe" size={20} color="#FF4B6A" />
            <Text style={styles.contactText}>www.alphadate.com</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem} onPress={handleEmailPress}>
            <Ionicons name="mail" size={20} color="#FF4B6A" />
            <Text style={styles.contactText}>info@alphadate.com</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <View style={styles.socialContainer}>
            <Text style={styles.socialTitle}>Follow Us</Text>
            <View style={styles.socialButtons}>
              <TouchableOpacity 
                style={styles.socialButton} 
                onPress={() => handleSocialPress('instagram')}
              >
                <Ionicons name="logo-instagram" size={24} color="#E4405F" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialButton} 
                onPress={() => handleSocialPress('twitter')}
              >
                <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialButton} 
                onPress={() => handleSocialPress('facebook')}
              >
                <Ionicons name="logo-facebook" size={24} color="#4267B2" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialButton} 
                onPress={() => handleSocialPress('linkedin')}
              >
                <Ionicons name="logo-linkedin" size={24} color="#0077B5" />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>

        {/* Legal */}
        <BlurView intensity={10} tint="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <Text style={styles.legalText}>
            © 2024 AlphaDate. All rights reserved.
          </Text>
          <Text style={styles.legalText}>
            AlphaDate is a registered trademark. Unauthorized use is prohibited.
          </Text>
        </BlurView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF4B6A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 5,
  },
  version: {
    fontSize: 14,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF4B6A',
    marginBottom: 15,
  },
  sectionText: {
    fontSize: 16,
    color: '#FFF',
    lineHeight: 24,
    marginBottom: 15,
  },
  missionPoints: {
    marginTop: 10,
  },
  missionPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  missionPointText: {
    fontSize: 16,
    color: '#FFF',
    marginLeft: 12,
    flex: 1,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureContent: {
    flex: 1,
    marginLeft: 15,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  contactText: {
    fontSize: 16,
    color: '#FFF',
    flex: 1,
    marginLeft: 12,
  },
  socialContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  socialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 15,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  legalText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 5,
  },
});