import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  FlatList,
  Platform,
  Animated,
  ImageBackground,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 30;
const CARD_HEIGHT = height * 0.6;

// Mock data for demonstration
const USERS = [
  {
    id: '1',
    name: 'Sarah',
    age: 24,
    image: 'https://picsum.photos/800/1200?random=1',
    distance: '3 miles away',
    interests: ['Travel', 'Photography', 'Music', 'Art'],
    lastActive: '2 mins ago',
    bio: 'Adventure seeker & coffee lover ☕️',
    compatibility: '95%',
    occupation: 'Photographer',
    location: 'New York City',
  },
  {
    id: '2',
    name: 'Emily',
    age: 26,
    image: 'https://picsum.photos/800/1200?random=2',
    distance: '5 miles away',
    interests: ['Art', 'Yoga', 'Reading', 'Travel'],
    lastActive: 'Online',
    bio: 'Life is art, be creative 🎨',
    compatibility: '88%',
    occupation: 'Yoga Instructor',
    location: 'Brooklyn',
  },
  {
    id: '3',
    name: 'Jessica',
    age: 25,
    image: 'https://picsum.photos/800/1200?random=3',
    distance: '2 miles away',
    interests: ['Music', 'Dance', 'Travel', 'Food'],
    lastActive: '1 hour ago',
    bio: 'Dancing through life 💃',
    compatibility: '92%',
    occupation: 'Dance Teacher',
    location: 'Manhattan',
  },
];

const INTERESTS = [
  { id: '1', name: 'Travel', icon: 'map-pin' },
  { id: '2', name: 'Photography', icon: 'camera' },
  { id: '3', name: 'Music', icon: 'music' },
  { id: '4', name: 'Art', icon: 'palette' },
  { id: '5', name: 'Yoga', icon: 'heart' },
  { id: '6', name: 'Reading', icon: 'book-open' },
  { id: '7', name: 'Fitness', icon: 'activity' },
  { id: '8', name: 'Cooking', icon: 'coffee' },
  { id: '9', name: 'Dancing', icon: 'music' },
  { id: '10', name: 'Movies', icon: 'film' },
  { id: '11', name: 'Sports', icon: 'target' },
  { id: '12', name: 'Gaming', icon: 'gamepad' },
];

const CategoryChip = ({ label, isSelected, onPress }: { label: string; isSelected: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[
      styles.categoryChip,
      isSelected && styles.categoryChipSelected
    ]}
    onPress={onPress}
  >
    <Text style={[
      styles.categoryChipText,
      isSelected && styles.categoryChipTextSelected
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Create refs for card animations
  const cardAnimations = useRef(
    USERS.map(() => ({
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
      translateY: new Animated.Value(50)
    }))
  ).current;

  // Initialize animations on mount
  React.useEffect(() => {
    // Fade in screen
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Animate cards
    cardAnimations.forEach((animation, index) => {
      Animated.parallel([
        Animated.spring(animation.translateY, {
          toValue: 0,
          useNativeDriver: true,
          delay: index * 100,
        }),
        Animated.timing(animation.opacity, {
          toValue: 1,
          duration: 500,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  const handlePressIn = useCallback((index: number) => {
    const { scale, opacity } = cardAnimations[index];
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.98,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressOut = useCallback((index: number) => {
    const { scale, opacity } = cardAnimations[index];
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const renderUserCard = ({ item: user, index }: { item: typeof USERS[0], index: number }) => {
    const { scale, opacity, translateY } = cardAnimations[index];

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            opacity,
            transform: [{ scale }, { translateY }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.95}
          onPressIn={() => handlePressIn(index)}
          onPressOut={() => handlePressOut(index)}
          onPress={() => router.push('/(tabs)/profile' as any)}
          style={styles.cardTouchable}
        >
          <ImageBackground
            source={{ uri: user.image }}
            style={styles.cardBackground}
            imageStyle={styles.cardImage}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
              style={styles.cardContent}
            >
              <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}, {user.age}</Text>
                  <Text style={styles.userBio}>{user.bio}</Text>
                </View>
                <View style={styles.compatibilityBadge}>
                  <Text style={styles.compatibilityText}>{user.compatibility}</Text>
                </View>
              </View>

              <View style={styles.userDetails}>
                <View style={styles.detailItem}>
                  <Feather name="briefcase" size={16} color="#FFF" />
                  <Text style={styles.detailText}>{user.occupation}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Feather name="map-pin" size={16} color="#FFF" />
                  <Text style={styles.detailText}>{user.location}</Text>
                </View>
                <View style={styles.detailItem}>
                  <View style={[styles.statusDot, { 
                    backgroundColor: user.lastActive === 'Online' ? '#4CAF50' : '#999' 
                  }]} />
                  <Text style={styles.detailText}>{user.lastActive}</Text>
                </View>
              </View>

              <View style={styles.interestsContainer}>
                {user.interests.map((interest, i) => (
                  <View key={i} style={styles.interestChip}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton}>
                  <Feather name="x" size={24} color="#FF3B30" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.actionButtonPrimary]}>
                  <Feather name="heart" size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Feather name="message-circle" size={24} color="#0095F6" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Discover</Text>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Feather name="sliders" size={24} color="#262626" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#8E8E8E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, interests, or location..."
            placeholderTextColor="#8E8E8E"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          <CategoryChip 
            label="All" 
            isSelected={selectedCategory === 'All'}
            onPress={() => setSelectedCategory('All')}
          />
          <CategoryChip 
            label="Nearby" 
            isSelected={selectedCategory === 'Nearby'}
            onPress={() => setSelectedCategory('Nearby')}
          />
          <CategoryChip 
            label="Online" 
            isSelected={selectedCategory === 'Online'}
            onPress={() => setSelectedCategory('Online')}
          />
          <CategoryChip 
            label="New" 
            isSelected={selectedCategory === 'New'}
            onPress={() => setSelectedCategory('New')}
          />
        </ScrollView>
      </View>

      {/* User Cards */}
      <FlatList
        data={USERS}
        renderItem={renderUserCard}
        keyExtractor={user => user.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <BlurView intensity={20} tint="light" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Feather name="x" size={24} color="#262626" />
              </TouchableOpacity>
            </View>

            <View style={styles.filtersContainer}>
              <Text style={styles.filterSectionTitle}>Interests</Text>
              <View style={styles.interestsGrid}>
                {INTERESTS.map((interest) => (
                  <TouchableOpacity
                    key={interest.id}
                    style={[
                      styles.interestButton,
                      selectedInterests.includes(interest.name) && styles.selectedInterest
                    ]}
                    onPress={() => {
                      if (selectedInterests.includes(interest.name)) {
                        setSelectedInterests(selectedInterests.filter(i => i !== interest.name));
                      } else {
                        setSelectedInterests([...selectedInterests, interest.name]);
                      }
                    }}
                  >
                    <Feather 
                      name={interest.icon as any} 
                      size={20} 
                      color={selectedInterests.includes(interest.name) ? '#FFF' : '#262626'} 
                    />
                    <Text style={[
                      styles.interestButtonText,
                      selectedInterests.includes(interest.name) && styles.selectedInterestText
                    ]}>
                      {interest.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Location</Text>
                <View style={styles.filterOption}>
                  <Feather name="map-pin" size={20} color="#262626" />
                  <Text style={styles.filterOptionText}>Within 5 miles</Text>
                  <Feather name="chevron-right" size={20} color="#8E8E8E" />
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Age Range</Text>
                <View style={styles.filterOption}>
                  <Feather name="users" size={20} color="#262626" />
                  <Text style={styles.filterOptionText}>18-35 years</Text>
                  <Feather name="chevron-right" size={20} color="#8E8E8E" />
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  setSelectedInterests([]);
                }}
              >
                <Text style={styles.resetButtonText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 15,
    backgroundColor: '#FFF',
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#262626',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#262626',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingRight: 15,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  categoryChipSelected: {
    backgroundColor: '#0095F6',
    borderColor: '#0095F6',
  },
  categoryChipText: {
    color: '#262626',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: '#FFF',
  },
  content: {
    padding: 15,
    gap: 20,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardTouchable: {
    flex: 1,
  },
  cardBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardImage: {
    borderRadius: 30,
  },
  cardContent: {
    padding: 25,
    paddingBottom: 30,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  userInfo: {
    flex: 1,
    marginRight: 15,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  userBio: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
  },
  compatibilityBadge: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  compatibilityText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  userDetails: {
    marginBottom: 20,
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    color: '#FFF',
    fontSize: 16,
    opacity: 0.9,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 25,
  },
  interestChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  interestText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 15,
  },
  actionButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: '#0095F6',
    flex: 1.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    flex: 1,
    marginTop: 100,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#262626',
  },
  filtersContainer: {
    padding: 20,
  },
  filterSection: {
    marginTop: 30,
  },
  filterSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 15,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  selectedInterest: {
    backgroundColor: '#0095F6',
    borderColor: '#0095F6',
  },
  interestButtonText: {
    fontSize: 14,
    color: '#262626',
    fontWeight: '500',
  },
  selectedInterestText: {
    color: '#FFF',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F8F8',
    borderRadius: 15,
    gap: 12,
  },
  filterOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#262626',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    backgroundColor: '#FFF',
  },
  resetButton: {
    flex: 1,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: '#F8F8F8',
  },
  resetButtonText: {
    color: '#262626',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: '#0095F6',
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
