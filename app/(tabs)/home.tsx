import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

const FEATURED_PROFILES = [
  {
    id: '1',
    name: 'Sarah, 24',
    image: 'https://picsum.photos/400/600?random=1',
    distance: '3 miles away',
    interests: ['Travel', 'Photography', 'Music'],
    bio: 'Adventure seeker and coffee enthusiast ☕️',
  },
  {
    id: '2',
    name: 'Emily, 26',
    image: 'https://picsum.photos/400/600?random=2',
    distance: '5 miles away',
    interests: ['Art', 'Yoga', 'Reading'],
    bio: 'Living life one page at a time 📚',
  },
  // Add more profiles as needed
];

export default function HomeScreen() {
  const { currentUser } = useAuth();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d1f3f']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {currentUser?.name}</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.featuredSection}>
            <Text style={styles.sectionTitle}>Featured Profiles</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsContainer}
            >
              {FEATURED_PROFILES.map((profile) => (
                <TouchableOpacity
                  key={profile.id}
                  style={styles.card}
                  activeOpacity={0.9}
                >
                  <ImageBackground
                    source={{ uri: profile.image }}
                    style={styles.cardImage}
                    imageStyle={{ borderRadius: 20 }}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.8)']}
                      style={styles.cardGradient}
                    >
                      <View style={styles.cardContent}>
                        <Text style={styles.cardName}>{profile.name}</Text>
                        <Text style={styles.cardDistance}>
                          <Ionicons name="location-outline" size={14} color="white" />
                          {' ' + profile.distance}
                        </Text>
                        <View style={styles.interestsContainer}>
                          {profile.interests.map((interest, index) => (
                            <View key={index} style={styles.interestTag}>
                              <Text style={styles.interestText}>{interest}</Text>
                            </View>
                          ))}
                        </View>
                        <Text style={styles.cardBio}>{profile.bio}</Text>
                      </View>
                    </LinearGradient>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.nearbySection}>
            <Text style={styles.sectionTitle}>People Nearby</Text>
            <View style={styles.gridContainer}>
              {Array(4).fill(null).map((_, index) => (
                <TouchableOpacity key={index} style={styles.gridItem}>
                  <Image
                    source={{ uri: `https://picsum.photos/200/200?random=${index + 10}` }}
                    style={styles.gridImage}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.gridGradient}
                  >
                    <Text style={styles.gridName}>Jessica, 25</Text>
                    <Text style={styles.gridDistance}>2 miles away</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  cardsContainer: {
    paddingRight: 20,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: 15,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  cardContent: {
    gap: 8,
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  cardDistance: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  interestTag: {
    backgroundColor: 'rgba(255,75,106,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  interestText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  cardBio: {
    color: 'white',
    opacity: 0.9,
    marginTop: 8,
  },
  nearbySection: {
    padding: 20,
    marginTop: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: (width - 50) / 2,
    height: (width - 50) / 2,
    borderRadius: 15,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  gridName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gridDistance: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
  },
});
