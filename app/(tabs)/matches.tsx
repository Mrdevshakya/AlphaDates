import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 45) / 2;

// Mock data
const MATCHES = [
  {
    id: '1',
    name: 'Sarah',
    age: 24,
    image: 'https://picsum.photos/400/400?random=1',
    lastActive: 'Online',
    matchTime: '2h ago',
    compatibility: '95%',
    newMatch: true,
  },
  {
    id: '2',
    name: 'Emma',
    age: 26,
    image: 'https://picsum.photos/400/400?random=2',
    lastActive: '1h ago',
    matchTime: '5h ago',
    compatibility: '88%',
    newMatch: true,
  },
  {
    id: '3',
    name: 'Jessica',
    age: 25,
    image: 'https://picsum.photos/400/400?random=3',
    lastActive: '30m ago',
    matchTime: '1d ago',
    compatibility: '92%',
    newMatch: false,
  },
  // Add more matches...
];

export default function MatchesScreen() {
  const renderMatchCard = (match: typeof MATCHES[0]) => (
    <TouchableOpacity
      key={match.id}
      style={styles.card}
      onPress={() => router.push(`/profile/${match.id}`)}
    >
      <Image source={{ uri: match.image }} style={styles.cardImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.cardOverlay}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardName}>{match.name}, {match.age}</Text>
            {match.newMatch && (
              <View style={styles.newMatchBadge}>
                <Text style={styles.newMatchText}>New</Text>
              </View>
            )}
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: match.lastActive === 'Online' ? '#4CAF50' : '#999' }]} />
              <Text style={styles.statusText}>{match.lastActive}</Text>
            </View>
            <View style={styles.compatibilityBadge}>
              <Text style={styles.compatibilityText}>{match.compatibility}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Matches</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options" size={20} color="#FF4B6A" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>24</Text>
          <Text style={styles.statLabel}>New Matches</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>85%</Text>
          <Text style={styles.statLabel}>Response Rate</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Conversations</Text>
        </View>
      </View>

      {/* Matches Grid */}
      <ScrollView 
        style={styles.matchesContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.matchesGrid}>
          {MATCHES.map(renderMatchCard)}
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  filterButton: {
    width: 45,
    height: 45,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    marginHorizontal: 15,
    backgroundColor: '#2d2d2d',
    borderRadius: 20,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  matchesContainer: {
    flex: 1,
    padding: 15,
  },
  matchesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 15,
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
    padding: 15,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  newMatchBadge: {
    backgroundColor: '#FF4B6A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  newMatchText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    color: '#ccc',
  },
  compatibilityBadge: {
    backgroundColor: 'rgba(255,75,106,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  compatibilityText: {
    color: '#FF4B6A',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
