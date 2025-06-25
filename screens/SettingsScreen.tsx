import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontSizeContext } from '../fontSizeContext';
import { useAuth } from '../AuthContext';

const FONT_SIZES = [
  { label: 'Big', value: 28 },
  { label: 'Medium', value: 22 },
  { label: 'Small', value: 16 },
];

function SettingsScreen() {
  const { fontSize, setFontSize } = useContext(FontSizeContext);
  const { signOut } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', padding: 24 }}>
      <Text style={{ fontSize: fontSize + 4, fontWeight: '600', marginBottom: 24 }}>Settings</Text>
      <Text style={{ fontSize: fontSize, marginBottom: 16 }}>Choose font size:</Text>
      {FONT_SIZES.map(option => (
        <TouchableOpacity
          key={option.label}
          onPress={() => setFontSize(option.value)}
          style={{
            backgroundColor: fontSize === option.value ? '#e0e0e0' : '#fff',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#ccc',
            paddingVertical: 16,
            marginBottom: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: option.value, fontWeight: '500' }}>{option.label}</Text>
        </TouchableOpacity>
      ))}
      
      <View style={{ marginTop: 32 }}>
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: '#ff3b30',
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: fontSize, fontWeight: '600' }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default SettingsScreen; 