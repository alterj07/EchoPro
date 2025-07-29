import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuiz } from '../contexts/QuizContext';
import { useUserProgress } from '../contexts/UserProgressContext';
import apiService from '../services/apiService';
import type { ITunesTrack } from '../contexts/QuizContext';

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
const DAILY_QUIZ_KEY = 'dailyQuizData';
const QUIZ_HISTORY_KEY = 'quizHistory';

const ChecklistScreen = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [screen, setScreen] = useState<'start' | 'quiz' | 'results'>('start');
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<ITunesTrack[]>([]);
  const [dailyData, setDailyData] = useState<DailyQuizData | null>(null);
  const [feedback, setFeedback] = useState<{ show: boolean; message: string; type: 'correct' | 'incorrect' | 'skipped' }>({ show: false, message: '', type: 'correct' });
  
  // Audio playback state for web
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [maxPlaybackTime, setMaxPlaybackTime] = useState(30);
  const [volume, setVolume] = useState(0.5);
  const timerRef = useRef<number | null>(null);
  const autoStopRef = useRef<number | null>(null);

  const { user } = useAuth();
  const { setQuizState, updateQuizProgress, quizState } = useQuiz();
  const { updateProgress } = useUserProgress();

  // Load data when component mounts
  useEffect(() => {
    loadDailyQuizData();
    loadTracks();
    loadSavedQuizState();
  }, [user?.uid]);

  // Load saved quiz state from backend when component mounts
  const loadSavedQuizState = async () => {
    if (!user?.uid) return;

    try {
      // Get user data from backend
      const userData = await apiService.getUser(user.uid);
      if (userData && userData.progress && userData.progress.length > 0) {
        // Find today's progress
        const today = new Date().toISOString().split('T')[0];
        const todayProgress = userData.progress.find((p: any) => p.period === 'daily');
        
        if (todayProgress && todayProgress.stats) {
          const { questionsAnswered, correct, incorrect, skipped } = todayProgress.stats;
          
          // Set daily data
          setDailyData({
            date: today,
            questionsAnswered: questionsAnswered || 0,
            correct: correct || 0,
            incorrect: incorrect || 0,
            skipped: skipped || 0,
          });

          // Check if there's an active quiz in progress (questions answered > 0 but < 10)
          if (questionsAnswered > 0 && questionsAnswered < 10) {
            // Check if there are saved questions in the user's progress
            if (todayProgress.quizQuestions && todayProgress.currentQuestionIndex !== undefined) {
              setQuestions(todayProgress.quizQuestions);
              setCurrentQuestionIndex(todayProgress.currentQuestionIndex);
              setCurrentQuestion(todayProgress.quizQuestions[todayProgress.currentQuestionIndex]);
              setScreen('quiz');
              console.log('Resumed quiz from question', todayProgress.currentQuestionIndex + 1);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading saved quiz state:', error);
    }
  };

  // Load daily quiz data from backend
  const loadDailyQuizData = async () => {
    if (!user?.uid) return;

    try {
      const userData = await apiService.getUser(user.uid);
      if (userData && userData.progress && userData.progress.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const todayProgress = userData.progress.find((p: any) => p.period === 'daily');
        
        if (todayProgress && todayProgress.stats) {
          const { questionsAnswered, correct, incorrect, skipped } = todayProgress.stats;
          setDailyData({
            date: today,
            questionsAnswered: questionsAnswered || 0,
            correct: correct || 0,
            incorrect: incorrect || 0,
            skipped: skipped || 0,
          });
        } else {
          // Initialize for today
          const newDailyData: DailyQuizData = {
            date: today,
            questionsAnswered: 0,
            correct: 0,
            incorrect: 0,
            skipped: 0,
          };
          setDailyData(newDailyData);
        }
      } else {
        // Initialize for today
        const today = new Date().toISOString().split('T')[0];
        const newDailyData: DailyQuizData = {
          date: today,
          questionsAnswered: 0,
          correct: 0,
          incorrect: 0,
          skipped: 0,
        };
        setDailyData(newDailyData);
      }
    } catch (error) {
      console.error('Error loading daily quiz data:', error);
    }
  };

  const loadTracks = async () => {
    try {
      console.log('Loading tracks...');
      setLoading(true);
      
      // Check if we have cached tracks from today
      const today = new Date().toISOString().split('T')[0];
      const cachedTracks = localStorage.getItem(`cached_tracks_${today}`);
      
      if (cachedTracks) {
        console.log('Using cached tracks from today');
        const tracks = JSON.parse(cachedTracks);
        setTracks(tracks);
        setLoading(false);
        return;
      }
      
      // If no cached tracks, fetch from iTunes API
      const response = await fetch('https://itunes.apple.com/search?term=popular&media=music&entity=song&limit=50');
      
      if (!response.ok) {
        if (response.status === 429) {
          console.error('Rate limited by iTunes API. Using fallback tracks.');
          // Use fallback tracks if rate limited
          const fallbackTracks = [
            { trackId: 1, trackName: "Shape of You", artistName: "Ed Sheeran", previewUrl: "", artworkUrl100: "" },
            { trackId: 2, trackName: "Blinding Lights", artistName: "The Weeknd", previewUrl: "", artworkUrl100: "" },
            { trackId: 3, trackName: "Dance Monkey", artistName: "Tones and I", previewUrl: "", artworkUrl100: "" },
            { trackId: 4, trackName: "Bad Guy", artistName: "Billie Eilish", previewUrl: "", artworkUrl100: "" },
            { trackId: 5, trackName: "Old Town Road", artistName: "Lil Nas X", previewUrl: "", artworkUrl100: "" },
            { trackId: 6, trackName: "Someone You Loved", artistName: "Lewis Capaldi", previewUrl: "", artworkUrl100: "" },
            { trackId: 7, trackName: "Truth Hurts", artistName: "Lizzo", previewUrl: "", artworkUrl100: "" },
            { trackId: 8, trackName: "Sunflower", artistName: "Post Malone", previewUrl: "", artworkUrl100: "" },
            { trackId: 9, trackName: "Señorita", artistName: "Shawn Mendes", previewUrl: "", artworkUrl100: "" },
            { trackId: 10, trackName: "Circles", artistName: "Post Malone", previewUrl: "", artworkUrl100: "" },
            { trackId: 11, trackName: "Lose You To Love Me", artistName: "Selena Gomez", previewUrl: "", artworkUrl100: "" },
            { trackId: 12, trackName: "Memories", artistName: "Maroon 5", previewUrl: "", artworkUrl100: "" },
            { trackId: 13, trackName: "10,000 Hours", artistName: "Dan + Shay", previewUrl: "", artworkUrl100: "" },
            { trackId: 14, trackName: "Good As Hell", artistName: "Lizzo", previewUrl: "", artworkUrl100: "" },
            { trackId: 15, trackName: "Beautiful People", artistName: "Ed Sheeran", previewUrl: "", artworkUrl100: "" },
            { trackId: 16, trackName: "Lover", artistName: "Taylor Swift", previewUrl: "", artworkUrl100: "" },
            { trackId: 17, trackName: "The Bones", artistName: "Maren Morris", previewUrl: "", artworkUrl100: "" },
            { trackId: 18, trackName: "Roxanne", artistName: "Arizona Zervas", previewUrl: "", artworkUrl100: "" },
            { trackId: 19, trackName: "Graveyard", artistName: "Halsey", previewUrl: "", artworkUrl100: "" },
            { trackId: 20, trackName: "Don't Call Me Up", artistName: "Mabel", previewUrl: "", artworkUrl100: "" }
          ];
          setTracks(fallbackTracks);
          // Cache the fallback tracks
          localStorage.setItem(`cached_tracks_${today}`, JSON.stringify(fallbackTracks));
          setLoading(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Tracks response:', data);
      console.log('Tracks count:', data.results?.length || 0);
      
      if (data.results && data.results.length > 0) {
        setTracks(data.results);
        // Cache the tracks for today
        localStorage.setItem(`cached_tracks_${today}`, JSON.stringify(data.results));
      } else {
        console.error('No tracks returned from iTunes API');
        setTracks([]);
      }
    } catch (error) {
      console.error('Error loading tracks:', error);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const generateQuizQuestions = (): Question[] => {
    console.log('generateQuizQuestions called with tracks:', tracks.length);
    const shuffledTracks = [...tracks].sort(() => Math.random() - 0.5);
    console.log('Shuffled tracks length:', shuffledTracks.length);
    
    const questions = shuffledTracks.slice(0, 10).map((track, index) => {
      const otherTracks = shuffledTracks.filter(t => t.trackId !== track.trackId);
      const options = [track.artistName];
      
      // Add 3 random incorrect options
      for (let i = 0; i < 3; i++) {
        const randomTrack = otherTracks[Math.floor(Math.random() * otherTracks.length)];
        if (randomTrack && !options.includes(randomTrack.artistName)) {
          options.push(randomTrack.artistName);
        }
      }
      
      // Shuffle options
      const shuffledOptions = options.sort(() => Math.random() - 0.5);
      
      return {
        id: `question_${index}`,
        track,
        options: shuffledOptions,
        correctAnswer: track.artistName,
        userAnswer: null,
        status: 'unanswered' as const
      };
    });
    
    console.log('Generated questions:', questions.length);
    return questions;
  };

  const handleStartQuiz = async () => {
    console.log('handleStartQuiz called');
    console.log('dailyData:', dailyData);
    console.log('tracks length:', tracks.length);
    
    if (!dailyData || dailyData.questionsAnswered >= DAILY_QUIZ_LIMIT) {
      alert('Daily quiz limit reached. Come back tomorrow!');
      return;
    }

    const quizQuestions = generateQuizQuestions();
    console.log('Generated questions:', quizQuestions.length);
    
    if (quizQuestions.length === 0) {
      alert('No tracks available for quiz. Please try again.');
      return;
    }
    
    setQuestions(quizQuestions);
    setCurrentQuestionIndex(0);
    setCurrentQuestion(quizQuestions[0]);
    setScreen('quiz');
    console.log('Screen set to quiz');

    // Save quiz state to backend
    if (user?.uid) {
      try {
        await apiService.saveQuizState(user.uid, quizQuestions, 0, {
          correct: dailyData.correct,
          incorrect: dailyData.incorrect,
          skipped: dailyData.skipped
        });
        console.log('Quiz state saved to backend');
      } catch (error) {
        console.error('Error saving quiz state:', error);
      }
    }

    // Initialize quiz state
    const initialQuizState = {
      questions: quizQuestions,
      currentQuestionIndex: 0,
      correctCount: dailyData.correct,
      incorrectCount: dailyData.incorrect,
      skippedCount: dailyData.skipped,
      quizId: `quiz_${Date.now()}`,
      startTime: Date.now(),
    };

    // Update QuizContext
    setQuizState(initialQuizState);

    // Save quiz state
    if (user?.uid) {
      // The following lines were removed as per the edit hint:
      // await saveQuizState(user.uid);
    }
  };

  const startQuestion = async () => {
    if (!currentQuestion) return;

    try {
      // Clear any existing timers
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);

      // For web, we'll simulate audio playback with a timer
      const duration = Math.floor(Math.random() * 21) + 10; // 10-30 seconds
      setMaxPlaybackTime(duration);
      setPlaybackDuration(0);
      
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
        // Pause logic for web
        if (timerRef.current) clearInterval(timerRef.current);
        setIsPlaying(false);
      } else {
        // Resume logic for web
        setIsPlaying(true);
        // Restart timer logic here
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const handleRestart = async () => {
    try {
      setPlaybackDuration(0);
      // Restart timer logic here
    } catch (error) {
      console.error('Error restarting track:', error);
    }
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    console.log('Volume changed to:', newVolume);
    setVolume(newVolume);
    // Volume logic for web
  };

  const showAnswerFeedback = (status: 'correct' | 'incorrect' | 'skipped') => {
    const messages = {
      correct: 'Correct! 🎉',
      incorrect: 'Incorrect! 😔',
      skipped: 'Skipped! 🤷‍♂️'
    };
    
    setFeedback({
      show: true,
      message: messages[status],
      type: status
    });
    
    setTimeout(() => {
      setFeedback({ show: false, message: '', type: 'correct' });
      // Move to next question after feedback
      handleNextQuestion();
    }, 2000);
  };

  const handleAnswer = async (selectedAnswer: string) => {
    if (!currentQuestion || !dailyData) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const status: 'unanswered' | 'correct' | 'incorrect' | 'skipped' = selectedAnswer === 'idk' ? 'skipped' : (isCorrect ? 'correct' : 'incorrect');

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

    // Save updated questions and daily data to backend
    if (user?.uid) {
      try {
        await apiService.saveQuizState(user.uid, updatedQuestions, currentQuestionIndex, {
          correct: updatedDailyData.correct,
          incorrect: updatedDailyData.incorrect,
          skipped: updatedDailyData.skipped
        });
      } catch (error) {
        console.error('Error saving quiz state:', error);
      }
    }

    // Update quiz state
    if (user?.uid) {
      // The following lines were removed as per the edit hint:
      // await saveQuizState(user.uid);
    }

    // Show feedback and automatically move to next question
    showAnswerFeedback(status);
  };

  const handleSkip = async () => {
    if (!currentQuestion) return;

    // Update question
    const updatedQuestion = { ...currentQuestion, userAnswer: 'idk', status: 'skipped' as const };
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex] = updatedQuestion;
    setQuestions(updatedQuestions);

    // Update daily data
    const updatedDailyData = { ...dailyData! };
    updatedDailyData.questionsAnswered += 1;
    updatedDailyData.skipped += 1;
    setDailyData(updatedDailyData);

    // Save updated questions and daily data to backend
    if (user?.uid) {
      try {
        await apiService.saveQuizState(user.uid, updatedQuestions, currentQuestionIndex, {
          correct: updatedDailyData.correct,
          incorrect: updatedDailyData.incorrect,
          skipped: updatedDailyData.skipped
        });
      } catch (error) {
        console.error('Error saving quiz state:', error);
      }
    }

    // Update quiz state
    if (user?.uid) {
      // The following lines were removed as per the edit hint:
      // await saveQuizState(user.uid);
    }

    // Show feedback and automatically move to next question
    showAnswerFeedback('skipped');
  };

  const handleNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex >= questions.length) {
      finishQuiz();
    } else {
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(questions[nextIndex]);
      
      // Save current index to backend
      if (user?.uid) {
        try {
          apiService.saveQuizState(user.uid, questions, nextIndex, {
            correct: dailyData?.correct || 0,
            incorrect: dailyData?.incorrect || 0,
            skipped: dailyData?.skipped || 0
          });
        } catch (error) {
          console.error('Error saving quiz state:', error);
        }
      }
      
      // Start the next question
      startQuestion();
    }
  };

  const finishQuiz = async () => {
    // Clear saved quiz state from backend
    if (user?.uid) {
      try {
        await apiService.clearQuizState(user.uid);
        console.log('Quiz state cleared from backend');
      } catch (error) {
        console.error('Error clearing quiz state:', error);
      }
    }

    // Update daily data
    const correct = questions.filter(q => q.status === 'correct').length;
    const incorrect = questions.filter(q => q.status === 'incorrect').length;
    const skipped = questions.filter(q => q.status === 'skipped').length;
    
    const updatedDailyData = {
      ...dailyData!,
      questionsAnswered: 10,
      correct: correct,
      incorrect: incorrect,
      skipped: skipped,
    };
    
    setDailyData(updatedDailyData);

    // Update backend progress
    try {
      if (user?.uid) {
        await updateProgress({
          quizId: `quiz_${Date.now()}`,
          totalQuestions: 10,
          correct: correct,
          incorrect: incorrect,
          skipped: skipped,
          timeSpent: 0, // TODO: Calculate actual time spent
          quizCompleted: true
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }

    setScreen('results');
  };

  const renderStartScreen = () => {
    // Check if there's an active quiz in progress
    const hasActiveQuiz = dailyData && dailyData.questionsAnswered > 0 && dailyData.questionsAnswered < 10;

    return (
      <div style={{ padding: 20, textAlign: 'center', width: '100%', maxWidth: '100%' }}>
        <h1 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 16 }}>Music Memory Quiz</h1>
        <p style={{ fontSize: 18, color: '#666', marginBottom: 32 }}>
          Test your memory with popular music! Listen to song previews and identify the artist.
        </p>
        
        {dailyData && (
          <div style={{ background: '#EFF6FF', padding: 16, borderRadius: 8, marginBottom: 24 }}>
            <h3 style={{ marginBottom: 8 }}>Today's Progress</h3>
            <p>Questions: {dailyData.questionsAnswered}/{DAILY_QUIZ_LIMIT}</p>
            <p>Correct: {dailyData.correct}</p>
          </div>
        )}
        
        {hasActiveQuiz ? (
          <button
            onClick={async () => {
              // Resume the quiz by reloading the component
              await loadSavedQuizState();
            }}
            style={{
              padding: '16px 32px',
              fontSize: 18,
              fontWeight: 'bold',
              background: '#10B981',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              marginBottom: 12,
            }}
          >
            🔄 Continue Quiz (Question {dailyData?.questionsAnswered || 0} of 10)
          </button>
        ) : (
          <button
            onClick={handleStartQuiz}
            style={{
              padding: '16px 32px',
              fontSize: 18,
              fontWeight: 'bold',
              background: '#2563EB',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginBottom: 12,
            }}
          >
            {loading ? 'Loading...' : 'Start Quiz'}
          </button>
        )}
      </div>
    );
  };

  const renderQuizScreen = () => {
    if (!currentQuestion) {
      return (
        <div style={{ padding: 20, textAlign: 'center', width: '100%', maxWidth: '100%' }}>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>No Quiz Available</h2>
          <p style={{ color: '#666', marginBottom: 24 }}>Please click "Start Quiz" to begin.</p>
          <button
            onClick={() => setScreen('start')}
            style={{
              padding: '12px 24px',
              fontSize: 16,
              background: '#2563EB',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Back to Start
          </button>
        </div>
      );
    }
    
    return (
      <div style={{ padding: 20, width: '100%', maxWidth: '100%', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button
              onClick={() => setScreen('start')}
              style={{
                padding: '8px 16px',
                fontSize: 14,
                background: '#6B7280',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              ← Back to Start
            </button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
                Question {currentQuestionIndex + 1} of {questions.length}
              </h2>
              <p style={{ color: '#666' }}>Listen to the song and identify the artist</p>
            </div>
            <div style={{ width: 100 }}></div> {/* Spacer for centering */}
          </div>
        </div>
        
        <div style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <button
              onClick={handlePlayPause}
              style={{
                padding: '12px 24px',
                fontSize: 16,
                background: isPlaying ? '#DC2626' : '#10B981',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                marginRight: 8,
              }}
            >
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            <button
              onClick={handleRestart}
              style={{
                padding: '12px 24px',
                fontSize: 16,
                background: '#6B7280',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              ⏹️ Stop
            </button>
          </div>
          
          <div style={{ 
            marginBottom: 16, 
            padding: '16px', 
            backgroundColor: '#FFFFFF', 
            borderRadius: '12px', 
            border: '2px solid #2563EB',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: 18, fontWeight: 'bold', color: '#2563EB' }}>🔊 Volume Control</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: '8px' }}>
              <span style={{ fontSize: 16, color: '#333', minWidth: 70, fontWeight: '600' }}>Volume:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                style={{
                  width: '250px',
                  height: '12px',
                  borderRadius: '6px',
                  background: '#E0E0E0',
                  outline: 'none',
                  cursor: 'pointer',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                }}
              />
              <span style={{ fontSize: 16, color: '#2563EB', minWidth: 50, fontWeight: 'bold' }}>{Math.round(volume * 100)}%</span>
            </div>
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: 14, color: '#666', fontStyle: 'italic' }}>Drag the slider to adjust volume</span>
            </div>
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <button 
                onClick={() => console.log('Volume test button clicked, current volume:', volume)}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  background: '#2563EB',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Test Volume Slider
              </button>
            </div>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Who is the artist?</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  style={{
                    padding: '12px 16px',
                    fontSize: 16,
                    background: '#F3F4F6',
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#E5E7EB';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#F3F4F6';
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={handleSkip}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              background: 'transparent',
              color: '#6B7280',
              border: '1px solid #D1D5DB',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Skip Question
          </button>
        </div>
        
        {feedback.show && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: feedback.type === 'correct' ? '#10B981' : feedback.type === 'incorrect' ? '#DC2626' : '#6B7280',
            color: '#fff',
            padding: '16px 24px',
            borderRadius: 8,
            fontSize: 18,
            fontWeight: 'bold',
            zIndex: 1000,
          }}>
            {feedback.message}
          </div>
        )}
      </div>
    );
  };

  const renderResultsScreen = () => {
    const correct = questions.filter(q => q.status === 'correct').length;
    const incorrect = questions.filter(q => q.status === 'incorrect').length;
    const skipped = questions.filter(q => q.status === 'skipped').length;
    const total = questions.length;
    const percentage = total > 0 ? (correct / total) * 100 : 0;
    
    return (
      <div style={{ padding: 20, textAlign: 'center', width: '100%', maxWidth: '100%' }}>
        <h1 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 16 }}>Quiz Complete!</h1>
        
        <div style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Your Results</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#10B981' }}>{correct}</div>
              <div style={{ color: '#666' }}>Correct</div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#DC2626' }}>{incorrect}</div>
              <div style={{ color: '#666' }}>Incorrect</div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#6B7280' }}>{skipped}</div>
              <div style={{ color: '#666' }}>Skipped</div>
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: percentage >= 80 ? '#10B981' : percentage >= 60 ? '#F59E0B' : '#DC2626' }}>
            {percentage.toFixed(1)}% Accuracy
          </div>
        </div>
        
        <button
          onClick={() => setScreen('start')}
          style={{
            padding: '16px 32px',
            fontSize: 18,
            fontWeight: 'bold',
            background: '#2563EB',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            marginRight: 16,
          }}
        >
          Take Another Quiz
        </button>
        
        <Link
          to="/dashboard"
          style={{
            display: 'inline-block',
            padding: '16px 32px',
            fontSize: 18,
            fontWeight: 'bold',
            background: '#6B7280',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: 8,
          }}
        >
          View Dashboard
        </Link>
      </div>
    );
  };

  console.log('Current screen:', screen);
  console.log('Current question:', currentQuestion);
  console.log('Questions length:', questions.length);

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#F8FAFC' }}>
      {screen === 'start' && renderStartScreen()}
      {screen === 'quiz' && renderQuizScreen()}
      {screen === 'results' && renderResultsScreen()}
    </div>
  );
};

export default ChecklistScreen; 