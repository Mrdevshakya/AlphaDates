import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 30;
const CARD_HEIGHT = height * 0.25;

// Mock data
const MATCHES = [
  {
    id: '1',
    name: 'Sarah',
    age: 24,
    image: 'https://picsum.photos/800/400?random=1',
    lastActive: 'Online',
    matchTime: '2h ago',
    compatibility: '95%',
    newMatch: true,
    mutualFriends: 3,
    interests: ['Travel', 'Music', 'Photography'],
    distance: '2 km away',
    bio: 'Adventure seeker & coffee lover ☕️',
    lastMessage: 'Hey, how are you?',
  },
  {
    id: '2',
    name: 'Emma',
    age: 26,
    image: 'https://picsum.photos/800/400?random=2',
    lastActive: '1h ago',
    matchTime: '5h ago',
    compatibility: '88%',
    newMatch: true,
    mutualFriends: 5,
    interests: ['Art', 'Food', 'Movies'],
    distance: '5 km away',
    bio: 'Art curator with a passion for life 🎨',
    lastMessage: null,
  },
  {
    id: '3',
    name: 'Jessica',
    age: 25,
    image: 'https://picsum.photos/800/400?random=3',
    lastActive: '30m ago',
    matchTime: '1d ago',
    compatibility: '92%',
    newMatch: false,
    mutualFriends: 2,
    interests: ['Sports', 'Books', 'Travel'],
    distance: '3 km away',
    bio: 'Bookworm and fitness enthusiast 📚💪',
    lastMessage: 'Would you like to meet for coffee?',
  },
];

const CategoryBadge = ({ label, count }: { label: string; count: number }) => (
  <View style={styles.categoryBadge}>
    <Text style={styles.categoryLabel}>{label}</Text>
    <View style={styles.categoryCount}>
      <Text style={styles.categoryCountText}>{count}</Text>
    </View>
  </View>
);

export default function MatchesScreen() {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  const renderMatchCard = (match: typeof MATCHES[0], index: number) => {
    const scale = new Animated.Value(1);
    const opacity = new Animated.Value(1);
    const translateX = new Animated.Value(50);

    React.useEffect(() => {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          delay: index * 100,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    const onPressIn = () => {
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
    };

    const onPressOut = () => {
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
    };

    return (
      <Animated.View
        key={match.id}
        style={[
          styles.cardContainer,
          {
            opacity,
            transform: [{ scale }, { translateX }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.95}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => router.push('/(tabs)/profile' as any)}
          style={styles.cardTouchable}
        >
          <ImageBackground
            source={{ uri: match.image }}
            style={styles.cardBackground}
            imageStyle={styles.cardImage}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
              style={styles.cardContent}
            >
              <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{match.name}, {match.age}</Text>
                  <Text style={styles.userBio}>{match.bio}</Text>
                </View>
                {match.newMatch && (
                  <View style={styles.newMatchBadge}>
                    <Text style={styles.newMatchText}>New Match</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.footerLeft}>
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusDot, { 
                      backgroundColor: match.lastActive === 'Online' ? '#4CAF50' : '#999' 
                    }]} />
                    <Text style={styles.statusText}>{match.lastActive}</Text>
                  </View>
                  <Text style={styles.distanceText}>{match.distance}</Text>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Feather name="message-circle" size={22} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.actionButtonPrimary]}>
                    <Feather name="user" size={22} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {match.lastMessage && (
                <View style={styles.messagePreview}>
                  <Feather name="message-square" size={16} color="#FFF" style={styles.messageIcon} />
                  <Text style={styles.messageText} numberOfLines={1}>
                    {match.lastMessage}
                  </Text>
                </View>
              )}
            </LinearGradient>

            <View style={styles.interestsContainer}>
              {match.interests.map((interest, i) => (
                <View key={i} style={styles.interestChip}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
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
          <Text style={styles.title}>Matches</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Feather name="sliders" size={24} color="#262626" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          <CategoryBadge label="All Matches" count={24} />
          <CategoryBadge label="New" count={8} />
          <CategoryBadge label="Messages" count={12} />
          <CategoryBadge label="Nearby" count={5} />
        </ScrollView>
      </View>

      {/* Matches List */}
      <Animated.ScrollView
        style={styles.matchesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.matchesContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0095F6"
          />
        }
      >
        {MATCHES.map((match, index) => renderMatchCard(match, index))}
      </Animated.ScrollView>
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
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingRight: 15,
    gap: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
    marginRight: 8,
  },
  categoryCount: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryCountText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  matchesContainer: {
    flex: 1,
  },
  matchesContent: {
    padding: 15,
    gap: 15,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
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
    justifyContent: 'space-between',
  },
  cardImage: {
    borderRadius: 20,
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  userBio: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  newMatchBadge: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  newMatchText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  distanceText: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: '#0095F6',
  },
  interestsContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    maxWidth: '50%',
    justifyContent: 'flex-end',
  },
  interestChip: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  interestText: {
    color: '#262626',
    fontSize: 12,
    fontWeight: '500',
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 12,
  },
  messageIcon: {
    marginRight: 8,
  },
  messageText: {
    color: '#FFF',
    fontSize: 14,
    flex: 1,
  },
});
