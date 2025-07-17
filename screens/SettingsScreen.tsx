import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontSizeContext } from '../fontSizeContext';
import { useAuth } from '../AuthContext';

const FONT_SIZES = [
  { label: 'Large', value: 32, description: 'Easiest to read' },
  { label: 'Medium', value: 24, description: 'Standard size' },
  { label: 'Small', value: 18, description: 'More content visible' },
];

function SettingsScreen() {
  const { fontSize, setFontSize } = useContext(FontSizeContext);
  const { signOut } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        {
          text: 'Stay Signed In',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Navigation will be handled automatically by auth state change
            } catch (error) {
              // Error is already handled in the context
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text Size</Text>
          <Text style={styles.sectionDescription}>
            Choose the text size that works best for you
          </Text>
          
          {FONT_SIZES.map(option => (
            <TouchableOpacity
              key={option.label}
              onPress={() => setFontSize(option.value)}
              style={[
                styles.fontOption,
                fontSize === option.value && styles.selectedFontOption
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.fontOptionContent}>
                <Text style={[
                  styles.fontOptionLabel,
                  { fontSize: option.value }
                ]}>
                  {option.label}
                </Text>
                <Text style={styles.fontOptionDescription}>
                  {option.description}
                </Text>
              </View>
              {fontSize === option.value && (
                <Text style={styles.selectedIndicator}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 32,
    paddingTop: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 40,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  sectionDescription: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 24,
    lineHeight: 24,
  },
  fontOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#E0E0E0',
    padding: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedFontOption: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  fontOptionContent: {
    flex: 1,
  },
  fontOptionLabel: {
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  fontOptionDescription: {
    fontSize: 16,
    color: '#666666',
  },
  selectedIndicator: {
    fontSize: 24,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default SettingsScreen; 