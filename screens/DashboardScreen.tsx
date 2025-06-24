import TrackPlayer from 'react-native-track-player';
import React, { useState, useContext, useEffect } from 'react';
import { StatusBar, useColorScheme, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontSizeContext } from '../fontSizeContext';
import { QuizContext } from '../QuizContext';

const QUIZ_HISTORY_KEY = 'quizHistory';

type DashboardStackParamList = {
  Dashboard: undefined;
  Settings: undefined;
};

type Period = 'day' | 'week' | 'month' | 'year' | 'all';

type QuizResult = {
  date: string;
  correct: number;
  incorrect: number;
  skipped: number;
  total: number;
};

type ProcessedHistoryItem = QuizResult & {
  percent: number;
  color: string;
};

type DailySummaryItem = {
    day: string; // e.g., 'Sunday'
    date: string; // e.g., '2023-10-29'
    correct: number;
    incorrect: number;
    skipped: number;
    total: number;
    percent: number;
    color: string;
}

type PerformanceData = {
  totalQuizzes: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalSkipped: number;
  overallPercent: number;
  history: (ProcessedHistoryItem | DailySummaryItem)[];
};


function DashboardScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const [period, setPeriod] = useState<Period>('week');
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const { quizState } = useContext(QuizContext);
  const navigation = useNavigation<StackNavigationProp<DashboardStackParamList, 'Dashboard'>>();
  const { fontSize } = useContext(FontSizeContext);
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const loadHistory = async () => {
    setLoading(true);
    try {
      const historyJson = await AsyncStorage.getItem(QUIZ_HISTORY_KEY);
      const history: QuizResult[] = historyJson ? JSON.parse(historyJson) : [];
      const data = processQuizHistory(history, period);
      setPerformanceData(data);
    } catch (e) {
      console.error('Failed to load quiz history.', e);
    } finally {
      setLoading(false);
    }
  };

  const processQuizHistory = (history: QuizResult[], selectedPeriod: Period): PerformanceData => {
    let filteredHistory = history;

    if (selectedPeriod !== 'all' && selectedPeriod !== 'day') {
      const now = new Date();
      let startDate = new Date();

      if (selectedPeriod === 'week') {
        startDate = new Date(now.setDate(now.getDate() - 7));
      } else if (selectedPeriod === 'month') {
        startDate = new Date(now.setMonth(now.getMonth() - 1));
      } else if (selectedPeriod === 'year') {
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      }
      
      filteredHistory = history.filter(item => new Date(item.date) >= startDate);
    }
    
    if (selectedPeriod === 'day') {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0)); // Start of today
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
      const lastSunday = new Date(today.setDate(today.getDate() - dayOfWeek));

      const weekHistory = history.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= lastSunday && itemDate < new Date(new Date().setHours(0,0,0,0)); // Up to start of today
      });

      const dailyData: { [key: string]: { correct: number, incorrect: number, skipped: number, total: number, date: string} } = {};

      for (let i = 0; i < new Date().getDay(); i++) {
          const day = new Date(lastSunday);
          day.setDate(lastSunday.getDate() + i);
          const dayString = getDayOfWeek(day);
          const dateString = day.toISOString().split('T')[0];
          dailyData[dayString] = { correct: 0, incorrect: 0, skipped: 0, total: 0, date: dateString };
      }

      weekHistory.forEach(item => {
          const dayString = getDayOfWeek(new Date(item.date));
          if (dailyData[dayString]) {
              dailyData[dayString].correct += item.correct;
              dailyData[dayString].incorrect += item.incorrect;
              dailyData[dayString].skipped += item.skipped;
              dailyData[dayString].total += item.total;
          }
      });
      
      const dailySummary: DailySummaryItem[] = Object.entries(dailyData).map(([day, data]) => {
          const percent = data.total > 0 ? (data.correct / data.total) * 100 : 0;
          const color = percent >= 80 ? '#4CAF50' : percent >= 60 ? '#FFC107' : '#F44336';
          return { ...data, day, percent, color };
      });

      const totalCorrect = dailySummary.reduce((acc, day) => acc + day.correct, 0);
      const totalQuestions = dailySummary.reduce((acc, day) => acc + day.total, 0);

      return {
          totalQuizzes: dailySummary.filter(d => d.total > 0).length,
          totalCorrect,
          totalIncorrect: dailySummary.reduce((acc, day) => acc + day.incorrect, 0),
          totalSkipped: dailySummary.reduce((acc, day) => acc + day.skipped, 0),
          overallPercent: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
          history: dailySummary,
      }
    }

    const totalQuizzes = filteredHistory.length;
    const totalCorrect = filteredHistory.reduce((acc, item) => acc + item.correct, 0);
    const totalIncorrect = filteredHistory.reduce((acc, item) => acc + item.incorrect, 0);
    const totalSkipped = filteredHistory.reduce((acc, item) => acc + item.skipped, 0);
    const grandTotal = totalCorrect + totalIncorrect + totalSkipped;
    const overallPercent = grandTotal > 0 ? (totalCorrect / grandTotal) * 100 : 0;

    const processedHistory: ProcessedHistoryItem[] = filteredHistory.map(item => {
      const totalAnswered = item.correct + item.incorrect;
      const percent = totalAnswered > 0 ? (item.correct / totalAnswered) * 100 : 0;
      const color = percent >= 80 ? '#4CAF50' : percent >= 60 ? '#FFC107' : '#F44336';
      return { ...item, percent, color };
    }).reverse();

    return { totalQuizzes, totalCorrect, totalIncorrect, totalSkipped, overallPercent, history: processedHistory };
  };

  const getDayOfWeek = (date: Date): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const PeriodButton = ({ p, label }: { p: Period; label: string }) => (
    <TouchableOpacity
      style={[styles.periodButton, period === p && styles.selectedPeriod]}
      onPress={() => setPeriod(p)}
    >
      <Text style={[styles.periodText, period === p && styles.selectedPeriodText]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderHistoryItem = (item: ProcessedHistoryItem | DailySummaryItem, index: number) => {
    const key = 'day' in item ? `${item.day}-${index}` : `${item.date}-${index}`;
    const title = 'day' in item ? item.day : new Date(item.date).toLocaleString();
    const stats = `Correct: ${item.correct}, Incorrect: ${item.incorrect}, Skipped: ${item.skipped}`;
    
    return (
      <View key={key} style={styles.historyItem}>
          <View style={[styles.percentageCircle, { borderColor: item.color }]}>
              <Text style={[styles.percentageText, { color: item.color }]}>{item.percent.toFixed(0)}%</Text>
          </View>
          <View style={styles.historyDetails}>
              <Text style={[styles.historyDate, { fontWeight: 'day' in item ? 'bold' : '500' }]}>{title}</Text>
              <Text style={styles.historyStats}>{stats}</Text>
          </View>
      </View>
    );
  };

  useEffect(() => {
    if (isFocused) {
      loadHistory();
    }
  }, [isFocused, period]);

  const liveCorrect = quizState?.correctCount ?? 0;
  const liveIncorrect = quizState?.incorrectCount ?? 0;
  const liveSkipped = quizState?.skippedCount ?? 0;
  const liveTotal = liveCorrect + liveIncorrect;
  const livePercent = liveTotal > 0 ? (liveCorrect / liveTotal) * 100 : 0;
  const livePerformanceColor = livePercent >= 80 ? '#4CAF50' : livePercent >= 60 ? '#FFC107' : '#F44336';

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Performance</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={fontSize + 8} color="#444" />
          </TouchableOpacity>
        </View>
        <Text style={styles.subTitle}>Dashboard</Text>
        
        {quizState && (
          <View style={[styles.card, { borderColor: livePerformanceColor }]}>
            <Text style={[styles.cardTitle, { fontSize: fontSize + 2 }]}>Today's Performance (Live)</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statLabel}>Correct:</Text><Text style={[styles.statValue, { color: '#4CAF50' }]}>{liveCorrect}</Text>
              <Text style={styles.statLabel}>Incorrect:</Text><Text style={[styles.statValue, { color: '#F44336' }]}>{liveIncorrect}</Text>
              <Text style={styles.statLabel}>Skipped:</Text><Text style={[styles.statValue, { color: '#FFC107' }]}>{liveSkipped}</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${livePercent}%`, backgroundColor: livePerformanceColor }]} />
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { fontSize: fontSize + 2 }]}>Performance History</Text>
          <View style={styles.periodContainer}>
            <PeriodButton p="day" label="Day" />
            <PeriodButton p="week" label="Week" />
            <PeriodButton p="month" label="Month" />
            <PeriodButton p="year" label="Year" />
            <PeriodButton p="all" label="All" />
          </View>

          {performanceData && performanceData.history.length > 0 ? (
            <>
              <View style={styles.statsRow}>
                <Text style={styles.statLabel}>Avg:</Text><Text style={[styles.statValue, { color: '#4CAF50' }]}>{performanceData.overallPercent.toFixed(0)}%</Text>
                <Text style={styles.statLabel}>Correct:</Text><Text style={[styles.statValue, { color: '#4CAF50' }]}>{performanceData.totalCorrect}</Text>
                <Text style={styles.statLabel}>Incorrect:</Text><Text style={[styles.statValue, { color: '#F44336' }]}>{performanceData.totalIncorrect}</Text>
                <Text style={styles.statLabel}>Skipped:</Text><Text style={[styles.statValue, { color: '#FFC107' }]}>{performanceData.totalSkipped}</Text>
              </View>
              <Text style={{ fontSize: fontSize, fontWeight: '500', marginBottom: 8, marginTop: 16 }}>
                {period === 'day' ? 'Daily Summary (This Week)' : 'History'}
              </Text>
              {performanceData.history.map(renderHistoryItem)}
            </>
          ) : (
            <Text style={styles.noDataText}>No quiz data available for this period.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { paddingHorizontal: 24, paddingTop: 32, flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '600', marginBottom: 4 },
  settingsButton: { padding: 8 },
  subTitle: { fontSize: 16, color: '#444', marginBottom: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  periodContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
  periodButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 8,
    backgroundColor: '#fff',
  },
  periodText: { color: '#444', fontSize: 14, fontWeight: '400', textTransform: 'capitalize' },
  selectedPeriod: { backgroundColor: '#f7f7f7' },
  selectedPeriodText: { fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statLabel: {
    color: '#666',
    fontSize: 14,
  },
  statValue: {
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 4,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  percentageCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  percentageText: {
    fontWeight: '700',
    fontSize: 14,
  },
  historyDetails: {
    flex: 1,
  },
  historyDate: {
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  historyStats: {
    color: '#666',
  },
  noDataText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 16 },
});

export default DashboardScreen; 