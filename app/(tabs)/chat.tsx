import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { RefreshControl } from 'react-native';

const { width } = Dimensions.get('window');

const CHATS = [
  {
    id: '1',
    name: 'Sarah Parker',
    image: 'https://via.placeholder.com/100x100',
    lastMessage: 'Would love to catch up soon! 😊',
    time: '2m ago',
    unread: 2,
    online: true,
    typing: false,
    age: '25',
    distance: '3 km away',
    matchPercentage: 95,
    lastSeen: new Date().toISOString(),
  },
  // ... rest of the mock data
];

const SECTIONS = {
  NEW_MATCHES: 'New Matches',
  MESSAGES: 'Messages',
};

const DEFAULT_AVATAR = 'https://via.placeholder.com/100x100';

export default function ChatsScreen() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState('All');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const scrollY = React.useRef(new Animated.Value(0)).current;

  const refreshChat = React.useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (err) {
      setError('Failed to refresh chats. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const renderNewMatch = React.useCallback((match: typeof CHATS[0]) => (
    <TouchableOpacity
      key={match.id}
      style={styles.newMatchItem}
      onPress={() => router.push({
        pathname: "/(tabs)/chat/[id]" as any,
        params: { id: match.id }
      })}
      activeOpacity={0.7}
    >
      <View style={styles.newMatchAvatarWrapper}>
        <Image
          source={{ uri: match.image || DEFAULT_AVATAR }}
          style={styles.newMatchAvatar}
          defaultSource={{ uri: DEFAULT_AVATAR }}
        />
        {match.online && (
          <View style={styles.onlineBadge} />
        )}
      </View>
      <Text style={styles.newMatchName} numberOfLines={1}>
        {match.name}
      </Text>
    </TouchableOpacity>
  ), []);

  const renderChatItem = React.useCallback((chat: typeof CHATS[0]) => (
    <TouchableOpacity
      key={chat.id}
      style={styles.chatItem}
      onPress={() => router.push({
        pathname: "/(tabs)/chat/[id]" as any,
        params: { id: chat.id }
      })}
      activeOpacity={0.7}
    >
      <View style={styles.chatAvatarContainer}>
        <Image
          source={{ uri: chat.image || DEFAULT_AVATAR }}
          style={styles.chatAvatar}
          defaultSource={{ uri: DEFAULT_AVATAR }}
        />
        {chat.online && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <View style={styles.chatHeaderLeft}>
            <Text style={styles.chatName}>{chat.name}</Text>
            <Text style={styles.chatDistance}>{chat.distance}</Text>
          </View>
          <Text style={styles.chatTime}>{chat.time}</Text>
        </View>
        
        <View style={styles.chatFooter}>
          <View style={styles.messageContainer}>
            {chat.typing ? (
              <View style={styles.typingContainer}>
                <Text style={styles.typingText}>typing</Text>
                <View style={styles.typingDots}>
                  <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
                  <View style={[styles.typingDot, { animationDelay: '200ms' }]} />
                  <View style={[styles.typingDot, { animationDelay: '400ms' }]} />
                </View>
              </View>
            ) : (
              <Text style={styles.lastMessage} numberOfLines={1}>
                {chat.lastMessage}
              </Text>
            )}
          </View>
          {chat.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{chat.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  ), []);

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {renderSearchBar()}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshChat}
            tintColor="#FFFFFF"
          />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{SECTIONS.NEW_MATCHES}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.newMatchesContainer}
                contentContainerStyle={styles.newMatchesContent}
              >
                {CHATS.slice(0, 5).map(renderNewMatch)}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{SECTIONS.MESSAGES}</Text>
              <View style={styles.chatList}>
                {CHATS.map(renderChatItem)}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#121212',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#121212',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 44,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    padding: 0,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  newMatchesContainer: {
    marginBottom: 20,
  },
  newMatchesContent: {
    paddingHorizontal: 15,
  },
  newMatchItem: {
    alignItems: 'center',
    marginHorizontal: 5,
    width: 80,
  },
  newMatchAvatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  newMatchAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#FF4B6A',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#121212',
  },
  newMatchName: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    width: '100%',
  },
  chatList: {
    paddingHorizontal: 20,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    marginBottom: 10,
  },
  chatAvatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  chatAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#1E1E1E',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chatHeaderLeft: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  chatDistance: {
    fontSize: 12,
    color: '#666',
  },
  chatTime: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  chatFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageContainer: {
    flex: 1,
  },
  lastMessage: {
    fontSize: 14,
    color: '#999',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    color: '#FF4B6A',
    fontSize: 14,
    marginRight: 6,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF4B6A',
    marginHorizontal: 2,
    opacity: 0.5,
  },
  unreadBadge: {
    backgroundColor: '#FF4B6A',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF4B6A',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
