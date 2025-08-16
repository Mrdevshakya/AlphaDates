import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function TabLayout() {
  const { user, unreadMessagesCount, unreadNotificationsCount } = useAuth();

  if (!user) return null;

  const handleNotificationPress = () => {
    router.push('/notifications');
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF4B6A',
        tabBarInactiveTintColor: '#666',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#333',
          backgroundColor: '#1a1a1a',
          height: 60,
          position: 'absolute',
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarHideOnKeyboard: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerTitle: 'AlphaDate',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={handleNotificationPress}
              >
                <Ionicons name="notifications-outline" size={24} color="#fff" />
                {unreadNotificationsCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ marginRight: 15 }}
                onPress={() => router.push('/chats/messgae')}
              >
                <Ionicons name="chatbubble-outline" size={24} color="#fff" />
                {unreadMessagesCount > 0 && (
                  <View style={styles.chatBadge}>
                    <Text style={styles.chatBadgeText}>
                      {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="add-post"
        options={{
          title: 'Add Post',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          headerTitle: 'Your Matches',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: '#FF4B6A',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationButton: {
    marginRight: 15,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: '#FF4B6A',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatBadge: {
    position: 'absolute',
    right: -12,
    top: -3,
    backgroundColor: '#FF4B6A',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  chatBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
