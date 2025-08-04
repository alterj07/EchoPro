import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProgress } from '../contexts/UserProgressContext';
import apiService from '../services/apiService';

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
  day: string;
  date: string;
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
  const [period, setPeriod] = useState<Period>('week');
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const { todayProgress } = useAuth();
  const { userProgress, loading: progressLoading } = useUserProgress();
  const { user } = useAuth();

  // Calculate live progress values from AuthContext data
  const liveCorrect = todayProgress.correct;
  const liveIncorrect = todayProgress.incorrect;
  const liveSkipped = todayProgress.skipped;
  const liveTotal = todayProgress.total;
  const livePercent = todayProgress.percent;
  const livePerformanceColor = liveTotal > 0 ? (livePercent >= 80 ? '#4CAF50' : livePercent >= 60 ? '#FFC107' : '#F44336') : '#ccc';

  // Debug logging
  console.log('Dashboard - Today Progress from AuthContext:', todayProgress);
  console.log('Dashboard - Live Stats:', { liveCorrect, liveIncorrect, liveSkipped, liveTotal, livePercent });

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      if (user?.uid) {
        console.log('Dashboard - Loading history for user:', user.uid, 'period:', period);
        const dashboardData = await apiService.getDashboardData(user.uid, period);
        console.log('Dashboard - Dashboard data received:', dashboardData);
        
        if (dashboardData && dashboardData.history) {
          console.log('Dashboard - History found:', dashboardData.history);
          // Convert backend data format to our format
          const history: QuizResult[] = dashboardData.history.map((item: any) => ({
            date: item.date || new Date().toISOString(),
            correct: item.correct || 0,
            incorrect: item.incorrect || 0,
            skipped: item.skipped || 0,
            total: (item.correct || 0) + (item.incorrect || 0) + (item.skipped || 0)
          }));
          console.log('Dashboard - Converted history:', history);
          const data = processQuizHistory(history, period);
          console.log('Dashboard - Processed data:', data);
          setPerformanceData(data);
        } else {
          console.log('Dashboard - No history found, checking for stats');
          // If no history but we have stats, create a summary entry
          if (dashboardData && (dashboardData.totalCorrect > 0 || dashboardData.totalIncorrect > 0 || dashboardData.totalSkipped > 0)) {
            console.log('Dashboard - Creating summary from stats:', {
              totalCorrect: dashboardData.totalCorrect,
              totalIncorrect: dashboardData.totalIncorrect,
              totalSkipped: dashboardData.totalSkipped
            });
            const summaryHistory: QuizResult[] = [{
              date: new Date().toISOString(),
              correct: dashboardData.totalCorrect || 0,
              incorrect: dashboardData.totalIncorrect || 0,
              skipped: dashboardData.totalSkipped || 0,
              total: (dashboardData.totalCorrect || 0) + (dashboardData.totalIncorrect || 0) + (dashboardData.totalSkipped || 0)
            }];
            console.log('Dashboard - Summary history:', summaryHistory);
            const data = processQuizHistory(summaryHistory, period);
            console.log('Dashboard - Processed summary data:', data);
            setPerformanceData(data);
          } else {
            console.log('Dashboard - No data available');
            // No data available
            setPerformanceData({
              totalQuizzes: 0,
              totalCorrect: 0,
              totalIncorrect: 0,
              totalSkipped: 0,
              overallPercent: 0,
              history: []
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to load quiz history.', e);
      setPerformanceData({
        totalQuizzes: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        totalSkipped: 0,
        overallPercent: 0,
        history: []
      });
    } finally {
      setLoading(false);
    }
  }, [user?.uid, period]);

  useEffect(() => {
    loadHistory();
  }, [period]); // Only depend on period, not the function

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

    const totalQuizzes = filteredHistory.length;
    const totalCorrect = filteredHistory.reduce((acc, item) => acc + item.correct, 0);
    const totalIncorrect = filteredHistory.reduce((acc, item) => acc + item.incorrect, 0);
    const totalSkipped = filteredHistory.reduce((acc, item) => acc + item.skipped, 0);
    const grandTotal = totalCorrect + totalIncorrect + totalSkipped;
    const overallPercent = grandTotal > 0 ? (totalCorrect / grandTotal) * 100 : 0;

    let processedHistory: (ProcessedHistoryItem | DailySummaryItem)[];

    if (selectedPeriod === 'day') {
      // For day period, show only one activity entry with current day's totals
      const today = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      const totalAnswered = totalCorrect + totalIncorrect;
      const isActive = totalAnswered > 0;
      const percent = isActive ? (totalCorrect / totalAnswered) * 100 : 0;
      const color = isActive ? (percent >= 80 ? '#4CAF50' : percent >= 60 ? '#FFC107' : '#F44336') : '#ccc';
      
      processedHistory = [{
        day: today,
        date: new Date().toISOString(),
        correct: totalCorrect,
        incorrect: totalIncorrect,
        skipped: totalSkipped,
        total: grandTotal,
        percent,
        color,
        isActive
      }];
    } else {
      // For other periods, show all history items as before
      processedHistory = filteredHistory.map(item => {
        const totalAnswered = item.correct + item.incorrect;
        const isActive = totalAnswered > 0;
        const percent = isActive ? (item.correct / totalAnswered) * 100 : 0;
        const color = isActive ? (percent >= 80 ? '#4CAF50' : percent >= 60 ? '#FFC107' : '#F44336') : '#ccc';
        return { ...item, percent, color, isActive };
      }).reverse();
    }

    return { totalQuizzes, totalCorrect, totalIncorrect, totalSkipped, overallPercent, history: processedHistory };
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
    <button
      style={{
        border: period === p ? '3px solid #2563EB' : '3px solid #E0E0E0',
        borderRadius: '20px',
        padding: '12px 16px',
        backgroundColor: period === p ? '#2563EB' : '#FFFFFF',
        color: period === p ? '#FFFFFF' : '#666666',
        fontSize: '16px',
        fontWeight: period === p ? 'bold' : '600',
        cursor: 'pointer',
        minWidth: '80px',
        textTransform: 'capitalize'
      }}
      onClick={() => setPeriod(p)}
    >
      {label}
    </button>
  );

  const renderHistoryItem = (item: ProcessedHistoryItem | DailySummaryItem, index: number) => {
    const key = 'day' in item ? `${item.day}-${index}` : `${item.date}-${index}`;
    const title = 'day' in item ? item.day : new Date(item.date).toLocaleString();
    const stats = `Correct: ${item.correct}, Incorrect: ${item.incorrect}, Skipped: ${item.skipped}`;
    
    return (
      <div key={key} style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 0',
        borderBottom: '2px solid #E0E0E0'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: item.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          {item.percent.toFixed(0)}%
        </div>
        <div style={{ marginLeft: '20px', flex: 1 }}>
          <div style={{ 
            fontWeight: 'day' in item ? 'bold' : '600',
            color: '#1A1A1A',
            marginBottom: '4px',
            fontSize: '18px'
          }}>
            {title}
          </div>
          <div style={{ color: '#666666', fontSize: '16px' }}>
            {stats}
          </div>
        </div>
      </div>
    );
  };

  if (loading || progressLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#F8FAFC'
      }}>
        <div style={{ fontSize: '18px', color: '#666666', marginTop: '16px', fontWeight: '500' }}>
          Loading your progress...
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <div style={{ padding: '24px', width: '100%', maxWidth: '100%', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#1A1A1A',
            letterSpacing: '0.5px',
            margin: 0
          }}>
            Your Music Progress
          </h1>
          
        </div>
        
        {todayProgress && (
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            marginBottom: '24px'
          }}>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              marginBottom: '16px',
              color: '#1F2937'
            }}>
              Today's Live Progress
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>{liveCorrect}</div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>Correct</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F59E0B' }}>{liveIncorrect}</div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>Incorrect</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6B7280' }}>{liveSkipped}</div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>Skipped</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: livePerformanceColor }}>{liveTotal}</div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>Total</div>
              </div>
            </div>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: livePerformanceColor 
              }}>
                {livePercent.toFixed(1)}% Accuracy
              </div>
            </div>
          </div>
        )}

        {userProgress && userProgress.overallStats && (
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '24px',
            borderRadius: '20px',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              marginBottom: '20px',
              color: '#1A1A1A',
              letterSpacing: '0.5px',
              margin: '0 0 20px 0'
            }}>
              Overall Progress
            </h2>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              marginBottom: '24px',
              gap: '16px'
            }}>
              <div style={{
                flex: 1,
                minWidth: '45%',
                textAlign: 'center',
                padding: '16px',
                backgroundColor: '#F8FAFC',
                borderRadius: '16px',
                border: '2px solid #E0E0E0'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#666666', marginBottom: '4px' }}>
                  Total Quizzes
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563EB' }}>
                  {userProgress.overallStats.totalQuizzesTaken || 0}
                </div>
              </div>
              <div style={{
                flex: 1,
                minWidth: '45%',
                textAlign: 'center',
                padding: '16px',
                backgroundColor: '#F8FAFC',
                borderRadius: '16px',
                border: '2px solid #E0E0E0'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#666666', marginBottom: '4px' }}>
                  Overall Accuracy
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4CAF50' }}>
                  {(userProgress.overallStats.overallAccuracy || 0).toFixed(1)}%
                </div>
              </div>
              <div style={{
                flex: 1,
                minWidth: '45%',
                textAlign: 'center',
                padding: '16px',
                backgroundColor: '#F8FAFC',
                borderRadius: '16px',
                border: '2px solid #E0E0E0'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#666666', marginBottom: '4px' }}>
                  Current Streak
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FF9800' }}>
                  {userProgress.overallStats.currentStreak || 0} days
                </div>
              </div>
              <div style={{
                flex: 1,
                minWidth: '45%',
                textAlign: 'center',
                padding: '16px',
                backgroundColor: '#F8FAFC',
                borderRadius: '16px',
                border: '2px solid #E0E0E0'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#666666', marginBottom: '4px' }}>
                  Best Score
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9C27B0' }}>
                  {(userProgress.overallStats.bestQuizScore || 0).toFixed(1)}%
                </div>
              </div>
            </div>
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                Total Questions: {userProgress.overallStats.totalQuestionsAnswered || 0}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                Total Time: {formatTime(userProgress.overallStats.totalTimeSpent || 0)}
              </div>
            </div>
          </div>
        )}

        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            marginBottom: '20px',
            color: '#1A1A1A',
            letterSpacing: '0.5px',
            margin: '0 0 20px 0'
          }}>
            Your History
          </h2>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <PeriodButton p="day" label="Day" />
            <PeriodButton p="week" label="Week" />
            <PeriodButton p="month" label="Month" />
            <PeriodButton p="year" label="Year" />
            <PeriodButton p="all" label="All Time" />
          </div>

          {performanceData && performanceData.history.length > 0 ? (
            <>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                marginBottom: '24px',
                gap: '16px'
              }}>
                <div style={{
                  flex: 1,
                  minWidth: '45%',
                  textAlign: 'center',
                  padding: '16px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '16px',
                  border: '2px solid #E0E0E0'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#666666', marginBottom: '4px' }}>
                    Average Score
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4CAF50' }}>
                    {performanceData.overallPercent.toFixed(0)}%
                  </div>
                </div>
                <div style={{
                  flex: 1,
                  minWidth: '45%',
                  textAlign: 'center',
                  padding: '16px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '16px',
                  border: '2px solid #E0E0E0'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#666666', marginBottom: '4px' }}>
                    Total Correct
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4CAF50' }}>
                    {performanceData.totalCorrect}
                  </div>
                </div>
                <div style={{
                  flex: 1,
                  minWidth: '45%',
                  textAlign: 'center',
                  padding: '16px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '16px',
                  border: '2px solid #E0E0E0'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#666666', marginBottom: '4px' }}>
                    Total Incorrect
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#F44336' }}>
                    {performanceData.totalIncorrect}
                  </div>
                </div>
                <div style={{
                  flex: 1,
                  minWidth: '45%',
                  textAlign: 'center',
                  padding: '16px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '16px',
                  border: '2px solid #E0E0E0'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#666666', marginBottom: '4px' }}>
                    Total Skipped
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFC107' }}>
                    {performanceData.totalSkipped}
                  </div>
                </div>
              </div>
              
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1A1A1A',
                marginBottom: '16px',
                letterSpacing: '0.5px'
              }}>
                Recent Activity
              </h3>
              
              <div style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '16px',
                padding: '16px'
              }}>
                {performanceData.history.map(renderHistoryItem)}
              </div>
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 0'
            }}>
              <div style={{ 
                fontSize: '20px', 
                color: '#666666', 
                marginBottom: '8px',
                fontWeight: '600'
              }}>
                No quiz data available for this period.
              </div>
              <div style={{
                fontSize: '16px',
                color: '#888888',
                fontStyle: 'italic'
              }}>
                Start taking quizzes to see your progress here!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardScreen; 