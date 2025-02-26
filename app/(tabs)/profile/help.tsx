import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HELP_SECTIONS = [
  {
    title: 'Frequently Asked Questions',
    items: [
      { title: 'How to change my profile picture?', icon: 'image-outline' },
      { title: 'How to update my preferences?', icon: 'options-outline' },
      { title: 'How to manage matches?', icon: 'heart-outline' },
      { title: 'How to report a user?', icon: 'flag-outline' },
    ],
  },
  {
    title: 'Contact Support',
    items: [
      { title: 'Email Support', icon: 'mail-outline' },
      { title: 'Live Chat', icon: 'chatbubbles-outline' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { title: 'Terms of Service', icon: 'document-text-outline' },
      { title: 'Privacy Policy', icon: 'shield-checkmark-outline' },
      { title: 'Community Guidelines', icon: 'people-outline' },
    ],
  },
];

export default function HelpScreen() {
  return (
    <ScrollView style={styles.container}>
      {HELP_SECTIONS.map((section, index) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.helpItem}
              >
                <View style={styles.helpItemLeft}>
                  <Ionicons name={item.icon} size={24} color="#FF4B6A" />
                  <Text style={styles.helpItemText}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  section: {
    padding: 20,
    paddingBottom: 0,
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
  helpItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  helpItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  helpItemText: {
    fontSize: 16,
    color: 'white',
  },
  appInfo: {
    padding: 20,
    alignItems: 'center',
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
  },
});
