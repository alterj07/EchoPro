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
import { useAuth } from '../AuthContext';
import { useUserProgress } from '../UserProgressContext';
import CircularProgress from '../components/CircularProgress';



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
  isActive: boolean;
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
    isActive: boolean;
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
  const { user } = useAuth();
  const { userProgress, loading: progressLoading } = useUserProgress();
  const navigation = useNavigation<StackNavigationProp<DashboardStackParamList, 'Dashboard'>>();
  const { fontSize } = useContext(FontSizeContext);
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  
  // User-specific storage key
  const userId = user?.uid || 'anonymous';
  const QUIZ_HISTORY_KEY = `quizHistory_${userId}`;

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
          const isActive = data.total > 0;
          const percent = isActive ? (data.correct / data.total) * 100 : 0;
          const color = isActive ? (percent >= 80 ? '#4CAF50' : percent >= 60 ? '#FFC107' : '#F44336') : '#ccc';
          return { ...data, day, percent, color, isActive };
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
      const isActive = totalAnswered > 0;
      const percent = isActive ? (item.correct / totalAnswered) * 100 : 0;
      const color = isActive ? (percent >= 80 ? '#4CAF50' : percent >= 60 ? '#FFC107' : '#F44336') : '#ccc';
      return { ...item, percent, color, isActive };
    }).reverse();

    return { totalQuizzes, totalCorrect, totalIncorrect, totalSkipped, overallPercent, history: processedHistory };
  };

  const getDayOfWeek = (date: Date): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const PeriodButton = ({ p, label }: { p: Period; label: string }) => (
    <TouchableOpacity
      style={[styles.periodButton, period === p && styles.selectedPeriod]}
      onPress={() => setPeriod(p)}
      activeOpacity={0.7}
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
          <CircularProgress
            correct={item.correct}
            incorrect={item.incorrect}
            skipped={item.skipped}
            total={item.total}
            size={60}
          />
          <View style={styles.historyDetails}>
              <Text style={[styles.historyDate, { fontWeight: 'day' in item ? 'bold' : '600' }]}>{title}</Text>
              <Text style={styles.historyStats}>{stats}</Text>
          </View>
      </View>
    );
  };

  useEffect(() => {
    if (isFocused) {
      loadHistory();
    }
  }, [isFocused, period, userId]); // Reload when user changes

  const liveCorrect = quizState?.correctCount ?? 0;
  const liveIncorrect = quizState?.incorrectCount ?? 0;
  const liveSkipped = quizState?.skippedCount ?? 0;
  const liveTotal = liveCorrect + liveIncorrect + liveSkipped;
  const livePercent = liveTotal > 0 ? (liveCorrect / liveTotal) * 100 : 0;
  const livePerformanceColor = liveTotal > 0 ? (livePercent >= 80 ? '#4CAF50' : livePercent >= 60 ? '#FFC107' : '#F44336') : '#ccc';

  if (loading || progressLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Music Progress</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsButton} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={28} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
        
        {quizState && (
          <View style={[styles.card, styles.liveCard, { borderColor: livePerformanceColor }]}>
            <Text style={styles.cardTitle}>Today's Live Progress</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Correct</Text>
                <Text style={[styles.statValue, { color: '#4CAF50' }]}>{liveCorrect}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Incorrect</Text>
                <Text style={[styles.statValue, { color: '#F44336' }]}>{liveIncorrect}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Skipped</Text>
                <Text style={[styles.statValue, { color: '#FFC107' }]}>{liveSkipped}</Text>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Success Rate: {livePercent.toFixed(0)}%</Text>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${livePercent}%`, backgroundColor: livePerformanceColor }]} />
              </View>
            </View>
          </View>
        )}

        {userProgress && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Overall Progress</Text>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Quizzes</Text>
                <Text style={[styles.summaryValue, { color: '#2563EB' }]}>{userProgress.overallStats.totalQuizzesTaken}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Overall Accuracy</Text>
                <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>{userProgress.overallStats.overallAccuracy.toFixed(1)}%</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Current Streak</Text>
                <Text style={[styles.summaryValue, { color: '#FF9800' }]}>{userProgress.overallStats.currentStreak} days</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Best Score</Text>
                <Text style={[styles.summaryValue, { color: '#9C27B0' }]}>{userProgress.overallStats.bestQuizScore.toFixed(1)}%</Text>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Total Questions: {userProgress.overallStats.totalQuestionsAnswered}</Text>
              <Text style={styles.progressLabel}>Total Time: {formatTime(userProgress.overallStats.totalTimeSpent)}</Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your History</Text>
          <View style={styles.periodContainer}>
            <PeriodButton p="day" label="Day" />
            <PeriodButton p="week" label="Week" />
            <PeriodButton p="month" label="Month" />
            <PeriodButton p="year" label="Year" />
            <PeriodButton p="all" label="All Time" />
          </View>

          {performanceData && performanceData.history.length > 0 ? (
            <>
              <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Average Score</Text>
                  <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>{performanceData.overallPercent.toFixed(0)}%</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Correct</Text>
                  <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>{performanceData.totalCorrect}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Incorrect</Text>
                  <Text style={[styles.summaryValue, { color: '#F44336' }]}>{performanceData.totalIncorrect}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Skipped</Text>
                  <Text style={[styles.summaryValue, { color: '#FFC107' }]}>{performanceData.totalSkipped}</Text>
                </View>
              </View>
              
              <Text style={styles.sectionTitle}>
                {period === 'day' ? 'This Week\'s Daily Summary' : 'Recent Activity'}
              </Text>
              
              <View style={styles.historyContainer}>
                {performanceData.history.map(renderHistoryItem)}
              </View>
            </>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No quiz data available for this period.</Text>
              <Text style={styles.noDataSubtext}>Start taking quizzes to see your progress here!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  container: { 
    paddingHorizontal: 24, 
    paddingTop: 24, 
    flex: 1 
  },
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F8FAFC'
  },
  loadingText: {
    fontSize: 18,
    color: '#666666',
    marginTop: 16,
    fontWeight: '500'
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 24
  },
  headerTitle: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#1A1A1A',
    letterSpacing: 0.5
  },
  settingsButton: { 
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  card: { 
    backgroundColor: '#FFFFFF', 
    padding: 24, 
    borderRadius: 20, 
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5
  },
  liveCard: {
    borderWidth: 3,
    borderStyle: 'solid'
  },
  cardTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20,
    color: '#1A1A1A',
    letterSpacing: 0.5
  },
  periodContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 8
  },
  periodButton: {
    borderWidth: 3,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    minWidth: 80,
    alignItems: 'center'
  },
  periodText: { 
    color: '#666666', 
    fontSize: 16, 
    fontWeight: '600', 
    textTransform: 'capitalize' 
  },
  selectedPeriod: { 
    backgroundColor: '#2563EB',
    borderColor: '#2563EB'
  },
  selectedPeriodText: { 
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1
  },
  statLabel: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 24,
    color: '#1A1A1A'
  },
  progressContainer: {
    marginTop: 8
  },
  progressLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0'
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
    textAlign: 'center'
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A'
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
    letterSpacing: 0.5
  },
  historyContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
  },
  historyDetails: {
    flex: 1,
    marginLeft: 20
  },
  historyDate: {
    color: '#1A1A1A',
    fontWeight: '600',
    marginBottom: 4,
    fontSize: 18
  },
  historyStats: {
    color: '#666666',
    fontSize: 16
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40
  },
  noDataText: { 
    fontSize: 20, 
    color: '#666666', 
    textAlign: 'center', 
    marginBottom: 8,
    fontWeight: '600'
  },
  noDataSubtext: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    fontStyle: 'italic'
  }
});

export default DashboardScreen; 