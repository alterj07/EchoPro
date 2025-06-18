import React, { useState, useContext } from 'react';
import { StatusBar, useColorScheme, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { FontSizeContext } from '../fontSizeContext';

type DashboardStackParamList = {
  Dashboard: undefined;
  Settings: undefined;
};

type Period = 'year' | 'month' | 'week' | 'day';
type HistoryItem = { date: string; correct: string; skip: number; percent: number; color: string };

const DUMMY_DATA: Record<Period, { percent: number; history: HistoryItem[] }> = {
  year: {
    percent: 65,
    history: [
      { date: '2025', correct: '120/200', skip: 10, percent: 60, color: '#ffe066' },
      { date: '2024', correct: '100/180', skip: 8, percent: 55, color: '#ffa366' },
      { date: '2023', correct: '80/150', skip: 5, percent: 53, color: '#ff6666' },
    ],
  },
  month: {
    percent: 45,
    history: [
      { date: 'June 2025', correct: '30/50', skip: 2, percent: 60, color: '#ffe066' },
      { date: 'May 2025', correct: '25/50', skip: 3, percent: 50, color: '#ffa366' },
      { date: 'April 2025', correct: '20/50', skip: 1, percent: 40, color: '#ff6666' },
    ],
  },
  week: {
    percent: 33,
    history: [
      { date: 'June 9-15, 2025', correct: '10/20', skip: 1, percent: 50, color: '#ffe066' },
      { date: 'June 2-8, 2025', correct: '7/20', skip: 2, percent: 35, color: '#ffa366' },
      { date: 'May 26 - June 1, 2025', correct: '3/20', skip: 0, percent: 15, color: '#ff6666' },
    ],
  },
  day: {
    percent: 27,
    history: [
      { date: 'Monday, June 12, 2025', correct: '5/10', skip: 0, percent: 50, color: '#ffe066' },
      { date: 'Monday, June 12, 2025', correct: '3/6', skip: 4, percent: 23, color: '#ffa366' },
      { date: 'Monday, June 12, 2025', correct: '1/10', skip: 0, percent: 10, color: '#ff6666' },
    ],
  },
};

function DashboardScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const [period, setPeriod] = useState<Period>('day');
  const { percent, history } = DUMMY_DATA[period];
  const navigation = useNavigation<StackNavigationProp<DashboardStackParamList, 'Dashboard'>>();
  const { fontSize } = useContext(FontSizeContext);
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: '#fff' }]}> 
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={{ paddingHorizontal: 24, paddingTop: 32, flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: fontSize + 8, fontWeight: '600', marginBottom: 4 }}>Hi, Tim <Text style={{ fontSize: fontSize + 4 }}>👋</Text></Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ padding: 8 }}>
            <Ionicons name="settings-outline" size={fontSize + 8} color="#444" />
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: fontSize, color: '#444', marginBottom: 16 }}>Dashboard</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
          {(['year', 'month', 'week', 'day'] as Period[]).map((label, idx) => (
            <TouchableOpacity
              key={label}
              onPress={() => setPeriod(label)}
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 4,
                marginLeft: idx === 0 ? 0 : 8,
                backgroundColor: period === label ? '#f7f7f7' : '#fff',
              }}
            >
              <Text style={{ color: '#444', fontSize: fontSize - 2, fontWeight: period === label ? '700' : '400' }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: '#4be18a', fontSize: fontSize + 10, fontWeight: '700' }}>▲ {percent}%</Text>
        </View>
        <Text style={{ fontSize: fontSize, fontWeight: '500', marginBottom: 8 }}>History</Text>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 + insets.bottom + 56 }}>
          {history.map((item: HistoryItem, idx: number) => (
            <View key={idx} style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#eee', marginBottom: 12, padding: 16, paddingRight: 80 }}>
              <Text style={{ fontSize: fontSize, fontWeight: '500', marginBottom: 4 }}>{item.date}</Text>
              <Text style={{ fontSize: fontSize - 2, color: '#444' }}>Correct: {item.correct}</Text>
              <Text style={{ fontSize: fontSize - 2, color: '#444' }}>Skip: {item.skip}</Text>
              <Text style={{ position: 'absolute', right: 20, top: 20, fontSize: fontSize + 8, fontWeight: '700', color: item.color }}>{item.percent}%</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export default DashboardScreen; 