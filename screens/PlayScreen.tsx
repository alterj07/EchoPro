import React from 'react';
import { View, Text, StatusBar, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DUMMY_VIDEOS = [
  'video1.mp4',
  'video2.mp4',
  'video3.mp4',
  'video4.mp4',
  'video5.mp4',
  'video6.mp4',
];



function PlayScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 40 }}>
        <Text style={{ fontSize: 28, color: '#888', fontWeight: '500', marginBottom: 24 }}>Performances</Text>
        {DUMMY_VIDEOS.map((file, idx) => {
          const name = file.replace('.mp4', '');
          return (
            <View
              key={file}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fff',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#eee',
                paddingVertical: 18,
                paddingHorizontal: 20,
                marginBottom: 18,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              {/* Dummy image */}
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#b3d1ff',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 18,
              }}>
                <Text style={{ color: '#3366cc', fontWeight: 'bold', fontSize: 20 }}>{name[0].toUpperCase()}</Text>
              </View>
              {/* Name */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, color: '#222', fontWeight: '500' }}>{name}</Text>
              </View>
              {/* Play button */}
              <TouchableOpacity
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#f88',
                  borderWidth: 2,
                  borderColor: '#222',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginLeft: 18,
                }}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 0,
                  height: 0,
                  borderTopWidth: 12,
                  borderBottomWidth: 12,
                  borderLeftWidth: 20,
                  borderTopColor: 'transparent',
                  borderBottomColor: 'transparent',
                  borderLeftColor: '#fff',
                  marginLeft: 4,
                }} />
              </TouchableOpacity>
    </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

export default PlayScreen; 