import { View, Text, StyleSheet, Switch } from 'react-native';

const NOTIFICATION_SETTINGS = [
  {
    title: 'Messages',
    items: [
      { key: 'newMessage', label: 'New Messages', value: true },
      { key: 'messageReactions', label: 'Message Reactions', value: true },
    ],
  },
  {
    title: 'Matches',
    items: [
      { key: 'newMatches', label: 'New Matches', value: true },
      { key: 'likedYou', label: 'Someone Liked You', value: true },
      { key: 'superLikes', label: 'Super Likes', value: true },
    ],
  },
  {
    title: 'Other',
    items: [
      { key: 'appUpdates', label: 'App Updates', value: false },
      { key: 'promotions', label: 'Promotions', value: false },
    ],
  },
];

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      {NOTIFICATION_SETTINGS.map((section, index) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.settingItem}>
                <Text style={styles.settingLabel}>{item.label}</Text>
                <Switch
                  value={item.value}
                  onValueChange={() => {}}
                  trackColor={{ false: '#666', true: '#FF4B6A' }}
                  thumbColor={item.value ? '#fff' : '#f4f3f4'}
                />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF4B6A',
    marginBottom: 16,
  },
  sectionContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingLabel: {
    fontSize: 16,
    color: 'white',
  },
});
