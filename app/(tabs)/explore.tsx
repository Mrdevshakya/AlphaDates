import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

// Mock data
const USERS = [
  {
    id: '1',
    name: 'Sarah, 24',
    distance: '3 miles away',
    bio: 'Adventure seeker & coffee lover ☕',
    images: ['https://picsum.photos/400/600?random=1'],
    interests: ['Travel', 'Photography', 'Hiking'],
    compatibility: '95%',
  },
  {
    id: '2',
    name: 'Emma, 26',
    distance: '5 miles away',
    bio: 'Art enthusiast & foodie 🎨',
    images: ['https://picsum.photos/400/600?random=2'],
    interests: ['Art', 'Cooking', 'Music'],
    compatibility: '88%',
  },
  // Add more users...
];

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Nearby');

  const renderUserCard = (user: typeof USERS[0]) => (
    <TouchableOpacity 
      key={user.id}
      style={styles.card}
      onPress={() => router.push(`/profile/${user.id}`)}
    >
      <Image source={{ uri: user.images[0] }} style={styles.cardImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.cardOverlay}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardName}>{user.name}</Text>
            <View style={styles.compatibilityBadge}>
              <Text style={styles.compatibilityText}>{user.compatibility}</Text>
            </View>
          </View>
          <Text style={styles.cardDistance}>{user.distance}</Text>
          <Text style={styles.cardBio}>{user.bio}</Text>
          <View style={styles.interestsContainer}>
            {user.interests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, interests..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options" size={20} color="#FF4B6A" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
      >
        {['Nearby', 'Online', 'New', 'Popular', 'Age'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              activeFilter === filter && styles.activeFilterChip,
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text 
              style={[
                styles.filterText,
                activeFilter === filter && styles.activeFilterText,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* User Cards */}
      <ScrollView 
        style={styles.cardsContainer}
        showsVerticalScrollIndicator={false}
      >
        {USERS.map(renderUserCard)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 45,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: 'white',
    fontSize: 16,
  },
  filterButton: {
    width: 45,
    height: 45,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2d2d2d',
    marginRight: 10,
  },
  activeFilterChip: {
    backgroundColor: '#FF4B6A',
  },
  filterText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  activeFilterText: {
    color: 'white',
  },
  cardsContainer: {
    padding: 15,
  },
  card: {
    width: CARD_WIDTH,
    height: 500,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  cardContent: {
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  compatibilityBadge: {
    backgroundColor: '#FF4B6A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  compatibilityText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cardDistance: {
    fontSize: 14,
    color: '#ccc',
  },
  cardBio: {
    fontSize: 16,
    color: 'white',
    marginTop: 5,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  interestTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  interestText: {
    color: 'white',
    fontSize: 12,
  },
});
