import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SETTINGS = [
  {
    title: 'Account',
    items: [
      { key: 'darkMode', label: 'Dark Mode', type: 'switch', value: true },
      { key: 'notifications', label: 'Push Notifications', type: 'switch', value: true },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { key: 'distance', label: 'Distance Preferences', type: 'link' },
      { key: 'ageRange', label: 'Age Range', type: 'link' },
    ],
  },
  {
    title: 'Security',
    items: [
      { key: 'password', label: 'Change Password', type: 'link' },
      { key: 'twoFactor', label: 'Two-Factor Authentication', type: 'switch', value: false },
    ],
  },
];

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      {SETTINGS.map((section, index) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.settingItem}
                disabled={item.type === 'switch'}
              >
                <Text style={styles.settingLabel}>{item.label}</Text>
                {item.type === 'switch' ? (
                  <Switch
                    value={item.value}
                    onValueChange={() => {}}
                    trackColor={{ false: '#666', true: '#FF4B6A' }}
                    thumbColor={item.value ? '#fff' : '#f4f3f4'}
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={24} color="#666" />
                )}
              </TouchableOpacity>
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
