import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuizContext } from '../QuizContext';
import { useAuth } from '../AuthContext';
import { useUserProgress } from '../UserProgressContext';
import TrackPlayer, { usePlaybackState, State } from 'react-native-track-player';
import { setupPlayer, addTrack } from '../services/trackPlayerService';
import { useIsFocused } from '@react-navigation/native';

interface ITunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  previewUrl: string;
}

type Question = {
  id: string;
  track: ITunesTrack;
  options: string[];
  correctAnswer: string;
  userAnswer: string | null;
  status: 'unanswered' | 'correct' | 'incorrect' | 'skipped';
};

interface DailyQuizData {
  date: string;
  questionsAnswered: number;
  correct: number;
  incorrect: number;
  skipped: number;
}

const DAILY_QUIZ_LIMIT = 20;

const ChecklistScreen = () => {
  const [screen, setScreen] = useState<'start' | 'quiz' | 'results'>('start');
  const [tracks, setTracks] = useState<ITunesTrack[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dailyData, setDailyData] = useState<DailyQuizData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [maxPlaybackTime, setMaxPlaybackTime] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'neutral'>('neutral');
  
  const { quizState, setQuizState } = useContext(QuizContext);
  const { user } = useAuth();
  const { updateProgress } = useUserProgress();
  const playbackState = usePlaybackState();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopRef = useRef<NodeJS.Timeout | null>(null);
  const isFocused = useIsFocused();
  
  // User-specific storage keys
  const userId = user?.uid || 'anonymous';
  const QUIZ_HISTORY_KEY = `quizHistory_${userId}`;
  const DAILY_QUIZ_KEY = `dailyQuizData_${userId}`;

  useEffect(() => {
    loadDailyQuizData();
    loadTracks();
    setupAudioPlayer();
  }, [userId]); // Reload when user changes

  useEffect(() => {
    if (screen === 'quiz' && currentQuestion) {
      startQuestion();
    }
  }, [currentQuestion]);

  useEffect(() => {
    // Update playing state based on track player state
    setIsPlaying(playbackState.state === State.Playing);
  }, [playbackState]);

  // Stop music when navigating away from the screen
  useEffect(() => {
    if (!isFocused) {
      stopMusic();
    }
    // Cleanup on unmount as well
    return () => {
      stopMusic();
    };
  }, [isFocused]);

  const setupAudioPlayer = async () => {
    try {
      await setupPlayer();
    } catch (error) {
      console.error('Error setting up audio player:', error);
    }
  };

  const stopMusic = async () => {
    try {
      await TrackPlayer.stop();
      setIsPlaying(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (autoStopRef.current) {
        clearTimeout(autoStopRef.current);
        autoStopRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping music:', error);
    }
  };

  const loadDailyQuizData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await AsyncStorage.getItem(DAILY_QUIZ_KEY);
      const parsedData: DailyQuizData | null = data ? JSON.parse(data) : null;
      
      if (parsedData && parsedData.date === today) {
        setDailyData(parsedData);
      } else {
        // Reset for new day
        const newDailyData: DailyQuizData = {
          date: today,
          questionsAnswered: 0,
          correct: 0,
          incorrect: 0,
          skipped: 0,
        };
        await AsyncStorage.setItem(DAILY_QUIZ_KEY, JSON.stringify(newDailyData));
        setDailyData(newDailyData);
      }
    } catch (error) {
      console.error('Error loading daily quiz data:', error);
    }
  };

  const loadTracks = async () => {
    setLoading(true);
    try {
      const topTracks = await getTop80sTracks();
      setTracks(topTracks);
    } catch (error) {
      console.error('Error loading tracks:', error);
      Alert.alert('Error', 'Failed to load songs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTop80sTracks = async (): Promise<ITunesTrack[]> => {
    const response = await fetch(`https://itunes.apple.com/search?term=1980s&entity=song&limit=100`);
    const data = await response.json();
    return data.results.filter((track: ITunesTrack) => track.previewUrl);
  };

  const generateQuizQuestions = (): Question[] => {
    if (tracks.length < 5) return [];
    
    const shuffledTracks = [...tracks].sort(() => Math.random() - 0.5);
    const questions: Question[] = [];
    
    for (let i = 0; i < Math.min(DAILY_QUIZ_LIMIT, shuffledTracks.length); i++) {
      const correctTrack = shuffledTracks[i];
      const otherTracks = shuffledTracks.filter((_, index) => index !== i);
      const wrongOptions = otherTracks
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(track => track.trackName);
      
      const options = [...wrongOptions, correctTrack.trackName].sort(() => Math.random() - 0.5);
      
      questions.push({
        id: `question_${i}`,
        track: correctTrack,
        options,
        correctAnswer: correctTrack.trackName,
        userAnswer: null,
        status: 'unanswered',
      });
    }
    
    return questions;
  };

  const handleStartQuiz = async () => {
    if (!dailyData) {
      Alert.alert('Error', 'Unable to load daily quiz data.');
      return;
    }

    if (dailyData.questionsAnswered >= DAILY_QUIZ_LIMIT) {
      Alert.alert('Daily Limit Reached', 'You have already completed your 20 questions for today. Come back tomorrow!');
      return;
    }

    const quizQuestions = generateQuizQuestions();
    if (quizQuestions.length === 0) {
      Alert.alert('Error', 'Not enough songs available. Please try again.');
      return;
    }

    setQuestions(quizQuestions);
    setCurrentQuestionIndex(0);
    setCurrentQuestion(quizQuestions[0]);
    setScreen('quiz');

    // Update QuizContext
    setQuizState({
      questions: quizQuestions,
      currentQuestionIndex: 0,
      correctCount: dailyData.correct,
      incorrectCount: dailyData.incorrect,
      skippedCount: dailyData.skipped,
    });
  };

  const startQuestion = async () => {
    if (!currentQuestion) return;

    try {
      // Clear any existing timers
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);

      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: currentQuestion.track.trackId.toString(),
        url: currentQuestion.track.previewUrl,
        title: currentQuestion.track.trackName,
        artist: currentQuestion.track.artistName,
      });

      // Random playback duration between 10-30 seconds
      const duration = Math.floor(Math.random() * 21) + 10; // 10-30 seconds
      setMaxPlaybackTime(duration);
      setPlaybackDuration(0);
      
      await TrackPlayer.play();
      setIsPlaying(true);

      // Start timer for progress tracking
      timerRef.current = setInterval(() => {
        setPlaybackDuration(prev => {
          if (prev >= duration) {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Auto-stop after duration
      autoStopRef.current = setTimeout(async () => {
        await TrackPlayer.stop();
        setIsPlaying(false);
        if (timerRef.current) clearInterval(timerRef.current);
      }, duration * 1000);

    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const handleRestart = async () => {
    try {
      await TrackPlayer.seekTo(0);
      await TrackPlayer.play();
      setPlaybackDuration(0);
    } catch (error) {
      console.error('Error restarting track:', error);
    }
  };

  const showAnswerFeedback = (status: 'correct' | 'incorrect' | 'skipped') => {
    let message = '';
    let type: 'correct' | 'incorrect' | 'neutral' = 'neutral';

    switch (status) {
      case 'correct':
        message = '🎉 Correct! Great job!';
        type = 'correct';
        break;
      case 'incorrect':
        message = '❌ Wrong answer!';
        type = 'incorrect';
        break;
      case 'skipped':
        message = '🤷 Skipped - no worries!';
        type = 'neutral';
        break;
    }

    setFeedbackMessage(message);
    setFeedbackType(type);
    setShowFeedback(true);

    // Hide feedback after 2 seconds
    setTimeout(() => {
      setShowFeedback(false);
    }, 2000);
  };

  const handleAnswer = async (selectedAnswer: string) => {
    if (!currentQuestion || !dailyData) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const status: 'unanswered' | 'correct' | 'incorrect' | 'skipped' = selectedAnswer === 'idk' ? 'skipped' : (isCorrect ? 'correct' : 'incorrect');

    // Stop the music immediately
    try {
      await TrackPlayer.stop();
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
    } catch (error) {
      console.error('Error stopping track:', error);
    }

    // Show feedback immediately
    showAnswerFeedback(status === 'skipped' ? 'skipped' : (status === 'correct' ? 'correct' : 'incorrect'));

    // Update question
    const updatedQuestion = { ...currentQuestion, userAnswer: selectedAnswer, status };
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex] = updatedQuestion;
    setQuestions(updatedQuestions);

    // Update daily data
    const updatedDailyData = { ...dailyData };
    updatedDailyData.questionsAnswered += 1;
    
    if (status === 'correct') {
      updatedDailyData.correct += 1;
    } else if (status === 'incorrect') {
      updatedDailyData.incorrect += 1;
    } else {
      updatedDailyData.skipped += 1;
    }

    setDailyData(updatedDailyData);
    await AsyncStorage.setItem(DAILY_QUIZ_KEY, JSON.stringify(updatedDailyData));

    // Update QuizContext
    setQuizState({
      questions: updatedQuestions,
      currentQuestionIndex,
      correctCount: updatedDailyData.correct,
      incorrectCount: updatedDailyData.incorrect,
      skippedCount: updatedDailyData.skipped,
    });

    // Save to quiz history
    await saveQuizHistory(updatedDailyData);

    // Move to next question or end quiz after showing feedback
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1 && updatedDailyData.questionsAnswered < DAILY_QUIZ_LIMIT) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setCurrentQuestion(updatedQuestions[nextIndex]);
      } else {
        setScreen('results');
      }
    }, 2500); // Slightly longer than feedback display
  };

  const saveQuizHistory = async (dailyData: DailyQuizData) => {
    try {
      // Save to local storage
      const historyJson = await AsyncStorage.getItem(QUIZ_HISTORY_KEY);
      const history = historyJson ? JSON.parse(historyJson) : [];
      
      const today = new Date().toISOString().split('T')[0];
      const existingEntryIndex = history.findIndex((entry: any) => entry.date === today);
      
      if (existingEntryIndex >= 0) {
        history[existingEntryIndex] = {
          date: today,
          correct: dailyData.correct,
          incorrect: dailyData.incorrect,
          skipped: dailyData.skipped,
          total: dailyData.questionsAnswered,
        };
      } else {
        history.push({
          date: today,
          correct: dailyData.correct,
          incorrect: dailyData.incorrect,
          skipped: dailyData.skipped,
          total: dailyData.questionsAnswered,
        });
      }
      
      await AsyncStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(history));
      
      // Save to backend progress service
      try {
        if (user) {
          await updateProgress({
            quizId: `quiz_${Date.now()}`,
            totalQuestions: dailyData.questionsAnswered,
            correct: dailyData.correct,
            incorrect: dailyData.incorrect,
            skipped: dailyData.skipped,
            timeSpent: 0 // TODO: Calculate actual time spent
          });
        }
      } catch (progressError) {
        console.error('Error saving to progress service:', progressError);
        // Don't fail the quiz if progress saving fails
      }
    } catch (error) {
      console.error('Error saving quiz history:', error);
    }
  };

  const resetAllData = async () => {
    Alert.alert(
      'Reset All Data',
      'This will delete ALL quiz data and allow you to do another 20 questions. This is for developer use only. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear daily quiz data
              await AsyncStorage.removeItem(DAILY_QUIZ_KEY);
              
              // Clear quiz history
              await AsyncStorage.removeItem(QUIZ_HISTORY_KEY);
              
              // Reset daily data to allow new questions
              const today = new Date().toISOString().split('T')[0];
              const newDailyData: DailyQuizData = {
                date: today,
                questionsAnswered: 0,
                correct: 0,
                incorrect: 0,
                skipped: 0,
              };
              await AsyncStorage.setItem(DAILY_QUIZ_KEY, JSON.stringify(newDailyData));
              setDailyData(newDailyData);
              
              // Reset QuizContext
              setQuizState({
                questions: [],
                currentQuestionIndex: 0,
                correctCount: 0,
                incorrectCount: 0,
                skippedCount: 0,
              });
              
              Alert.alert('Success', 'All data has been reset. You can now do another 20 questions.');
            } catch (error) {
              console.error('Error resetting data:', error);
              Alert.alert('Error', 'Failed to reset data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderStartScreen = () => (
    <View style={styles.container}>
      <Text style={styles.title}>80s Music Memory Quiz</Text>
      <Text style={styles.subtitle}>Test your knowledge of classic 80s songs!</Text>
      
      {dailyData && (
        <View style={styles.dailyStats}>
          <Text style={styles.statsTitle}>Today's Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Questions</Text>
              <Text style={styles.statValue}>{dailyData.questionsAnswered}/{DAILY_QUIZ_LIMIT}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Correct</Text>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>{dailyData.correct}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Incorrect</Text>
              <Text style={[styles.statValue, { color: '#F44336' }]}>{dailyData.incorrect}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Skipped</Text>
              <Text style={[styles.statValue, { color: '#FFC107' }]}>{dailyData.skipped}</Text>
            </View>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading your quiz...</Text>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.button, 
              dailyData && dailyData.questionsAnswered >= DAILY_QUIZ_LIMIT && styles.disabledButton
            ]} 
            onPress={handleStartQuiz}
            disabled={dailyData ? dailyData.questionsAnswered >= DAILY_QUIZ_LIMIT : false}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>
              {dailyData && dailyData.questionsAnswered >= DAILY_QUIZ_LIMIT 
                ? 'Daily Limit Reached' 
                : 'START QUIZ'
              }
            </Text>
          </TouchableOpacity>
          
          {/* Developer Reset Button */}
          <TouchableOpacity 
            style={styles.resetButton} 
            onPress={resetAllData}
            activeOpacity={0.7}
          >
            <Text style={styles.resetButtonText}>🔄 Reset All Data (Developer)</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderQuizScreen = () => {
    if (!currentQuestion) return null;

    const getOptionStyle = (option: string) => {
      if (!currentQuestion.userAnswer) return styles.option;
      
      if (option === currentQuestion.correctAnswer) {
        return [styles.option, styles.correctOption];
      }
      
      if (option === currentQuestion.userAnswer && option !== currentQuestion.correctAnswer) {
        return [styles.option, styles.incorrectOption];
      }
      
      return styles.option;
    };

    const getOptionTextStyle = (option: string) => {
      if (!currentQuestion.userAnswer) return styles.optionText;
      
      if (option === currentQuestion.correctAnswer) {
        return [styles.optionText, styles.correctOptionText];
      }
      
      if (option === currentQuestion.userAnswer && option !== currentQuestion.correctAnswer) {
        return [styles.optionText, styles.incorrectOptionText];
      }
      
      return styles.optionText;
    };

    return (
      <View style={styles.container}>
        <View style={styles.quizHeader}>
          <View style={styles.questionInfo}>
            <Text style={styles.questionNumber}>
              Question {currentQuestionIndex + 1} of {questions.length}
            </Text>
            <Text style={styles.progressText}>
              {dailyData?.questionsAnswered || 0}/{DAILY_QUIZ_LIMIT} completed today
            </Text>
          </View>
        </View>

        <View style={styles.playerSection}>
          <Text style={styles.playerTitle}>Listen to the Song</Text>
          <Text style={styles.playerText}>
            {isPlaying ? '🎵 Now Playing...' : '⏸️ Paused - Tap Play to Start'}
          </Text>
          
          <View style={styles.controlsContainer}>
            <TouchableOpacity style={styles.controlButton} onPress={handlePlayPause} activeOpacity={0.7}>
              <Text style={styles.controlButtonText}>
                {isPlaying ? '⏸️' : '▶️'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={handleRestart} activeOpacity={0.7}>
              <Text style={styles.controlButtonText}>🔄</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(playbackDuration / maxPlaybackTime) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.timeText}>
              {Math.floor(playbackDuration)}s / {maxPlaybackTime}s
            </Text>
          </View>
        </View>

        <View style={styles.questionSection}>
          <Text style={styles.questionPrompt}>What song is this?</Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={getOptionStyle(option)}
              onPress={() => handleAnswer(option)}
              disabled={currentQuestion.userAnswer !== null}
              activeOpacity={0.7}
            >
              <Text style={getOptionTextStyle(option)}>{option}</Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={getOptionStyle('idk')}
            onPress={() => handleAnswer('idk')}
            disabled={currentQuestion.userAnswer !== null}
            activeOpacity={0.7}
          >
            <Text style={getOptionTextStyle('idk')}>🤷 I don't know</Text>
          </TouchableOpacity>
        </View>

        {currentQuestion.userAnswer && (
          <View style={styles.resultFeedback}>
            <Text style={styles.songInfo}>
              "{currentQuestion.track.trackName}" by {currentQuestion.track.artistName}
            </Text>
          </View>
        )}

        {/* Floating feedback message */}
        {showFeedback && (
          <View style={[
            styles.floatingFeedback, 
            feedbackType === 'correct' ? styles.feedbackCorrect :
            feedbackType === 'incorrect' ? styles.feedbackIncorrect :
            styles.feedbackNeutral
          ]}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderResultsScreen = () => {
    if (!dailyData) return null;

    const totalAnswered = dailyData.correct + dailyData.incorrect + dailyData.skipped;
    const correctPercentage = totalAnswered > 0 ? (dailyData.correct / totalAnswered) * 100 : 0;
    const incorrectPercentage = totalAnswered > 0 ? (dailyData.incorrect / totalAnswered) * 100 : 0;
    const skippedPercentage = totalAnswered > 0 ? (dailyData.skipped / totalAnswered) * 100 : 0;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Quiz Complete!</Text>
        <Text style={styles.subtitle}>Great job! Here's how you did today.</Text>
        
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Today's Results</Text>
          
          <View style={styles.resultsGrid}>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Correct</Text>
              <Text style={[styles.resultValue, { color: '#4CAF50' }]}>
                {dailyData.correct}
              </Text>
              <Text style={styles.resultPercentage}>
                ({correctPercentage.toFixed(0)}%)
              </Text>
            </View>
            
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Incorrect</Text>
              <Text style={[styles.resultValue, { color: '#F44336' }]}>
                {dailyData.incorrect}
              </Text>
              <Text style={styles.resultPercentage}>
                ({incorrectPercentage.toFixed(0)}%)
              </Text>
            </View>
            
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Skipped</Text>
              <Text style={[styles.resultValue, { color: '#FFC107' }]}>
                {dailyData.skipped}
              </Text>
              <Text style={styles.resultPercentage}>
                ({skippedPercentage.toFixed(0)}%)
              </Text>
            </View>
          </View>
          
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total Questions Today</Text>
            <Text style={styles.totalValue}>{totalAnswered}</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, dailyData.questionsAnswered >= DAILY_QUIZ_LIMIT && styles.disabledButton]} 
            onPress={handleStartQuiz}
            disabled={dailyData.questionsAnswered >= DAILY_QUIZ_LIMIT}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>
              {dailyData.questionsAnswered >= DAILY_QUIZ_LIMIT 
                ? 'Daily Limit Reached' 
                : 'TAKE ANOTHER QUIZ'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {screen === 'start' && renderStartScreen()}
      {screen === 'quiz' && renderQuizScreen()}
      {screen === 'results' && renderResultsScreen()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  dailyStats: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resetButton: {
    backgroundColor: '#e74c3c',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quizHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  playerSection: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    gap: 20,
  },
  controlButton: {
    backgroundColor: '#3498db',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  controlButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  optionsContainer: {
    width: '100%',
  },
  option: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  correctOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  incorrectOption: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  correctOptionText: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  incorrectOptionText: {
    color: '#C62828',
    fontWeight: 'bold',
  },
  resultFeedback: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  songInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  floatingFeedback: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  feedbackCorrect: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  feedbackIncorrect: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 2,
  },
  feedbackNeutral: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFC107',
    borderWidth: 2,
  },
  feedbackText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultsContainer: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 16,
    color: '#333',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  questionInfo: {
    alignItems: 'center',
  },
  playerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  questionSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  questionPrompt: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  resultsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  resultCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '45%', // Adjust as needed for grid layout
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  resultPercentage: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});

export default ChecklistScreen; 