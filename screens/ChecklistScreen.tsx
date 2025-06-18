import React from 'react';
import { View, Text, StatusBar, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const ANSWERS = [
  'Stay With Me',
  "You're Gone",
  'I Need You to Stay',
  'She',
];

function ChecklistScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ marginTop: 60, alignItems: 'center' }}>
        <Text style={{ fontSize: 28, color: '#888', fontWeight: '500', textAlign: 'center' }}>Questions</Text>
        <Text style={{ fontSize: 28, color: '#888', fontWeight: '500', textAlign: 'center', marginBottom: 0 }}>Remaining:</Text>
        <Text style={{ fontSize: 32, color: '#888', fontWeight: '400', marginTop: 12, marginBottom: 32 }}>16</Text>
        {ANSWERS.map((ans, idx) => (
          <TouchableOpacity
            key={ans}
            style={{
              width: Dimensions.get('window').width - 48,
              backgroundColor: '#fff',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#ddd',
              paddingVertical: 18,
              marginBottom: 18,
              alignItems: 'center',
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20, color: '#222', fontWeight: '500' }}>{ans}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center' }}>
        <TouchableOpacity
          style={{
            width: 90,
            height: 90,
            borderRadius: 45,
            backgroundColor: '#f88',
            borderWidth: 3,
            borderColor: '#222',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={0.7}
        >
          <View style={{
            width: 0,
            height: 0,
            borderTopWidth: 22,
            borderBottomWidth: 22,
            borderLeftWidth: 38,
            borderTopColor: 'transparent',
            borderBottomColor: 'transparent',
            borderLeftColor: '#fff',
            marginLeft: 6,
          }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default ChecklistScreen; 