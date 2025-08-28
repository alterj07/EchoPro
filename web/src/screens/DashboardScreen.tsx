import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
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

type PerformanceData = any[];

function DashboardScreen() {
  const [period, setPeriod] = useState<Period>('week');
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [todayData, setTodayData] = useState<any>(null); // Today's progress from backend
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Calculate live progress values from backend daily progress data
  const liveCorrect = todayData?.correctAnswers || 0;
  const liveIncorrect = todayData?.incorrectAnswers || 0;
  const liveSkipped = todayData?.skippedAnswers || 0;
  const liveTotal = liveCorrect + liveIncorrect + liveSkipped;
  const livePercent = liveTotal > 0 ? (liveCorrect / liveTotal) * 100 : 0;
  const livePerformanceColor = liveTotal > 0 ? (livePercent >= 80 ? '#4CAF50' : livePercent >= 60 ? '#FFC107' : '#F44336') : '#ccc';

  // Get the correct index based on selected period
  const getPeriodIndex = (selectedPeriod: Period): number => {
    const periodMap: Record<Period, number> = {
      'day': 0,      // daily
      'week': 1,     // weekly  
      'month': 2,    // monthly
      'year': 3,     // yearly
      'all': 4       // all-time
    };
    return periodMap[selectedPeriod] || 0;
  };

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      if (user?.uid) {
        const dashboardData = await apiService.getDashboardData(user.uid);
        
        console.log('dashboardData', dashboardData);
        console.log('dashboardData?.progress?.[0]?.stats.totalQuestions', dashboardData?.progress?.[0]?.stats.totalQuestions);
        setPerformanceData(dashboardData.progress);
      }
    } catch (e) {
      setPerformanceData(null);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, period]);

  const loadTodayData = useCallback(async () => {
    if (user?.uid) {
      try {
        const dashboardData = await apiService.getDashboardData(user.uid);
        if (dashboardData.progress && dashboardData.progress.length > 0) {
          // Find daily progress (first element is daily)
          const dailyProgress = dashboardData.progress.find((p: any) => p.period === 'daily');
          if (dailyProgress) {
            setTodayData(dailyProgress);
          }
        }
      } catch (error) {
        // Error loading today's data
      }
    }
  }, [user?.uid]);

  useEffect(() => {
    loadHistory();
  }, [period]); // Reload when period changes

  useEffect(() => {
    loadTodayData();
  }, []);

 


  const PeriodButton = ({ p, label }: { p: Period; label: string }) => (
    <button
      style={{
        border: period === p ? '3px solid #2563EB' : '3px solid #E0E0E0',
        borderRadius: '20px',
        padding: 'clamp(8px, 1.5vw, 12px) clamp(12px, 2vw, 16px)',
        backgroundColor: period === p ? '#2563EB' : '#FFFFFF',
        color: period === p ? '#FFFFFF' : '#666666',
        fontSize: 'clamp(12px, 1.5vw, 16px)',
        fontWeight: period === p ? 'bold' : '600',
        cursor: 'pointer',
        minWidth: 'clamp(60px, 8vw, 80px)',
        textTransform: 'capitalize',
        whiteSpace: 'nowrap'
      }}
      onClick={() => setPeriod(p)}
    >
      {label}
    </button>
  );

  const renderHistoryItem = (item: any, index: number) => {
    const tble = ['daily', 'weekly', 'monthly', 'yearly', 'all'];
    console.log('item', item);
    console.log('index', index);
    const key = tble[index];
    const title = tble[index];
    const stats = `Correct: ${item.stats.correctAnswers}, Incorrect: ${item.stats.incorrectAnswers}, Skipped: ${item.stats.skippedAnswers}`;
    console.log('stats', stats);
    return (
      <div key={key} style={{
        display: 'flex',
        alignItems: 'center',
        padding: 'clamp(12px, 2vw, 16px) 0',
        borderBottom: '2px solid #E0E0E0',
        flexWrap: 'wrap',
        gap: 'clamp(8px, 1.5vw, 12px)'
      }}>
        <div style={{
          width: 'clamp(50px, 8vw, 60px)',
          height: 'clamp(50px, 8vw, 60px)',
          borderRadius: '50%',
          backgroundColor: item.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontWeight: 'bold',
          fontSize: 'clamp(11px, 1.2vw, 14px)',
          flexShrink: 0
        }}>
          {(item.percent || 0).toFixed(0)}%
        </div>
        <div style={{ 
          marginLeft: 'clamp(12px, 2vw, 20px)', 
          flex: 1,
          minWidth: '200px'
        }}>
          <div style={{ 
            fontWeight: 'day' in item ? 'bold' : '600',
            color: '#1A1A1A',
            marginBottom: '4px',
            fontSize: 'clamp(14px, 2vw, 18px)'
          }}>
            {title}
          </div>
          <div style={{ 
            color: '#666666', 
            fontSize: 'clamp(12px, 1.5vw, 16px)',
            wordBreak: 'break-word'
          }}>
            {stats}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#F8FAFC'
      }}>
        <div style={{ 
          fontSize: 'clamp(16px, 2vw, 18px)', 
          color: '#666666', 
          marginTop: '16px', 
          fontWeight: '500' 
        }}>
          Loading your progress...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh', 
      backgroundColor: '#F8FAFC',
      padding: 'clamp(12px, 2vw, 24px)',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: '0 clamp(8px, 2vw, 16px)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 'clamp(16px, 3vw, 24px)',
          flexWrap: 'wrap',
          gap: 'clamp(8px, 1.5vw, 12px)'
        }}>
          <h1 style={{ 
            fontSize: 'clamp(24px, 4vw, 32px)', 
            fontWeight: 'bold', 
            color: '#1A1A1A',
            letterSpacing: '0.5px',
            margin: 0
          }}>
            Your Music Progress
          </h1>
          
        </div>
        
        {(todayData || liveTotal > 0) && (
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: 'clamp(16px, 3vw, 24px)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            marginBottom: 'clamp(16px, 3vw, 24px)'
          }}>
            <h3 style={{ 
              fontSize: 'clamp(16px, 2.5vw, 20px)', 
              fontWeight: 'bold', 
              marginBottom: 'clamp(12px, 2vw, 16px)',
              color: '#1F2937'
            }}>
              Today's Live Progress
            </h3>
            <div style={{
              textAlign: 'center',
              marginBottom: 'clamp(12px, 2vw, 16px)',
              fontSize: 'clamp(14px, 2vw, 16px)',
              color: '#6B7280'
            }}>
              {performanceData?.[0].stats.totalQuestions > 0 ? '' : 'No questions answered yet'}
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', 
              gap: 'clamp(8px, 2vw, 16px)',
              maxWidth: '100%'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: 'clamp(18px, 3vw, 24px)', 
                  fontWeight: 'bold', 
                  color: '#10B981' 
                }}>
                  {performanceData?.[0]?.stats?.correctAnswers}
                </div>  
                <div style={{ 
                  fontSize: 'clamp(11px, 1.2vw, 14px)', 
                  color: '#6B7280' 
                }}>
                  Correct
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: 'clamp(18px, 3vw, 24px)', 
                  fontWeight: 'bold', 
                  color: '#F59E0B' 
                }}>
                  {performanceData?.[0]?.stats.incorrectAnswers}
                </div>
                <div style={{ 
                  fontSize: 'clamp(11px, 1.2vw, 14px)', 
                  color: '#6B7280' 
                }}>
                  Incorrect
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: 'clamp(18px, 3vw, 24px)', 
                  fontWeight: 'bold', 
                  color: '#6B7280' 
                }}>
                  {performanceData?.[0]?.stats.skippedAnswers}
                </div>
                <div style={{ 
                  fontSize: 'clamp(11px, 1.2vw, 14px)', 
                  color: '#6B7280' 
                }}>
                  Skipped
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: 'clamp(18px, 3vw, 24px)', 
                  fontWeight: 'bold', 
                  color: livePerformanceColor 
                }}>
                  {performanceData?.[0]?.stats.totalQuestions}
                </div>
                <div style={{ 
                  fontSize: 'clamp(11px, 1.2vw, 14px)', 
                  color: '#6B7280' 
                }}>
                  Total
                </div>
              </div>
            </div>
          </div>
        )}



        <div style={{
          backgroundColor: '#FFFFFF',
          padding: 'clamp(16px, 3vw, 24px)',
          borderRadius: '20px',
          marginBottom: 'clamp(16px, 3vw, 24px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            fontSize: 'clamp(18px, 3vw, 24px)', 
            fontWeight: 'bold', 
            marginBottom: 'clamp(12px, 2vw, 20px)',
            color: '#1A1A1A',
            letterSpacing: '0.5px',
            margin: '0 0 clamp(12px, 2vw, 20px) 0'
          }}>
            Your History
          </h2>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 'clamp(16px, 3vw, 24px)',
            flexWrap: 'wrap',
            gap: 'clamp(6px, 1vw, 8px)'
          }}>
            <PeriodButton p="day" label="Day" />
            <PeriodButton p="week" label="Week" />
            <PeriodButton p="month" label="Month" />
            <PeriodButton p="year" label="Year" />
            <PeriodButton p="all" label="All Time" />
          </div>

                    {/* Always show the stats cards */}
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: 'clamp(32px, 6vw, 48px)',
              color: '#666666',
              fontSize: 'clamp(14px, 2vw, 16px)'
            }}>
              Loading {period} data...
            </div>
          ) : performanceData ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'clamp(16px, 2.5vw, 20px)',
              marginBottom: 'clamp(20px, 3vw, 28px)'
            }}>
              <div style={{
                textAlign: 'center',
                padding: 'clamp(16px, 2.5vw, 20px)',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                border: 'none',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  fontSize: 'clamp(12px, 1.3vw, 15px)', 
                  fontWeight: '600', 
                  color: '#FFFFFF', 
                  marginBottom: '8px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  Accuracy Rate
                </div>
                <div style={{ 
                  fontSize: 'clamp(24px, 4vw, 32px)', 
                  fontWeight: 'bold', 
                  color: '#FFFFFF',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  {(() => {
                    const index = getPeriodIndex(period);
                    const correct = performanceData?.[index]?.stats.correctAnswers || 0;
                    const incorrect = performanceData?.[index]?.stats.incorrectAnswers || 0;
                    const skipped = performanceData?.[index]?.stats.skippedAnswers || 0;
                    const total = correct + incorrect + skipped;
                    return total > 0 ? ((correct / total) * 100).toFixed(1) : '0.0';
                  })()}%
                </div>
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '60px',
                  height: '60px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%'
                }} />
              </div>
              
              <div style={{
                textAlign: 'center',
                padding: 'clamp(16px, 2.5vw, 20px)',
                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                borderRadius: '20px',
                border: 'none',
                boxShadow: '0 8px 25px rgba(76, 175, 80, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  fontSize: 'clamp(12px, 1.3vw, 15px)', 
                  fontWeight: '600', 
                  color: '#FFFFFF', 
                  marginBottom: '8px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  Correct Answers
                </div>
                <div style={{ 
                  fontSize: 'clamp(24px, 4vw, 32px)', 
                  fontWeight: 'bold', 
                  color: '#FFFFFF',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  {performanceData?.[getPeriodIndex(period)]?.stats.correctAnswers || 0}
                </div>
                <div style={{
                  position: 'absolute',
                  top: '-15px',
                  right: '-15px',
                  width: '50px',
                  height: '50px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%'
                }} />
              </div>
              
              <div style={{
                textAlign: 'center',
                padding: 'clamp(16px, 2.5vw, 20px)',
                background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                borderRadius: '20px',
                border: 'none',
                boxShadow: '0 8px 25px rgba(255, 152, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  fontSize: 'clamp(12px, 1.3vw, 15px)', 
                  fontWeight: '600', 
                  color: '#FFFFFF', 
                  marginBottom: '8px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  Incorrect Answers
                </div>
                <div style={{ 
                  fontSize: 'clamp(24px, 4vw, 32px)', 
                  fontWeight: 'bold', 
                  color: '#FFFFFF',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  {performanceData?.[getPeriodIndex(period)]?.stats.incorrectAnswers || 0}
                </div>
                <div style={{
                  position: 'absolute',
                  top: '-15px',
                  right: '-15px',
                  width: '50px',
                  height: '50px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%'
                }} />
              </div>
              
              <div style={{
                textAlign: 'center',
                padding: 'clamp(16px, 2.5vw, 20px)',
                background: 'linear-gradient(135deg, #9E9E9E 0%, #757575 100%)',
                borderRadius: '20px',
                border: 'none',
                boxShadow: '0 8px 25px rgba(158, 158, 158, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  fontSize: 'clamp(12px, 1.3vw, 15px)', 
                  fontWeight: '600', 
                  color: '#FFFFFF', 
                  marginBottom: '8px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  Skipped Questions
                </div>
                <div style={{ 
                  fontSize: 'clamp(24px, 4vw, 32px)', 
                  fontWeight: 'bold', 
                  color: '#FFFFFF',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  {performanceData?.[getPeriodIndex(period)]?.stats.skippedAnswers || 0}
                </div>
                <div style={{
                  position: 'absolute',
                  top: '-15px',
                  right: '-15px',
                  width: '50px',
                  height: '50px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%'
                }} />
              </div>
            </div>
          ) : null}

          {/* Show history if available, otherwise show message */}
          {/* {performanceData && performanceData.length > 0 ? (
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              padding: 'clamp(8px, 1.5vw, 12px)'
            }}>
              {performanceData.map((item, index) => renderHistoryItem(item, index))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: 'clamp(32px, 6vw, 48px)',
              color: '#666666',
              fontSize: 'clamp(14px, 2vw, 16px)'
            }}>
              {performanceData && (performanceData?.[0]?.correctAnswers > 0 || performanceData?.[0]?.incorrectAnswers > 0 || performanceData?.[0]?.skippedAnswers > 0) 
                ? `No detailed history available for this ${period} period, but you can see your overall performance above.` 
                : `No data available for this ${period} period. Start taking quizzes to see your progress!`}
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}

export default DashboardScreen; 