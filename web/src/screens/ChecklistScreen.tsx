import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserProgress } from '../contexts/UserProgressContext';
import musicService from '../services/musicService';
import type { ITunesTrack } from '../services/musicService';

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
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'neutral'>('neutral');
  
  const { user } = useAuth();
  const { updateProgress } = useUserProgress();
  const autoStopRef = useRef<number | null>(null);
  
  const userId = user?.uid || 'anonymous';
  const QUIZ_HISTORY_KEY = `quizHistory_${userId}`;
  const DAILY_QUIZ_KEY = `dailyQuizData_${userId}`;

  useEffect(() => {
    loadDailyQuizData();
    loadTracks();
  }, [userId]);

  useEffect(() => {
    if (screen === 'quiz' && currentQuestion) {
      startQuestion();
    }
  }, [currentQuestion]);

  const loadDailyQuizData = async () => {
    try {
      const data = localStorage.getItem(DAILY_QUIZ_KEY);
      if (data) {
        const parsedData = JSON.parse(data);
        const today = new Date().toISOString().split('T')[0];
        if (parsedData.date === today) {
          setDailyData(parsedData);
        }
      }
    } catch (error) {
      console.error('Error loading daily quiz data:', error);
    }
  };

  const loadTracks = async () => {
    setLoading(true);
    try {
      const userTracks = await musicService.getPersonalizedTracks('1990-01-01'); // Default birthday
      setTracks(userTracks);
    } catch (error) {
      console.error('Error loading tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQuizQuestions = (): Question[] => {
    if (tracks.length === 0) return [];
    
    const shuffledTracks = [...tracks].sort(() => Math.random() - 0.5);
    const selectedTracks = shuffledTracks.slice(0, Math.min(DAILY_QUIZ_LIMIT, tracks.length));
    
    return selectedTracks.map((track, index) => {
      const otherTracks = tracks.filter(t => t.trackId !== track.trackId);
      const shuffledOthers = [...otherTracks].sort(() => Math.random() - 0.5);
      const options = [track.artistName, ...shuffledOthers.slice(0, 3).map(t => t.artistName)];
      
      return {
        id: `question_${index}`,
        track,
        options: options.sort(() => Math.random() - 0.5),
        correctAnswer: track.artistName,
        userAnswer: null,
        status: 'unanswered',
      };
    });
  };

  const handleStartQuiz = async () => {
    const newQuestions = generateQuizQuestions();
    if (newQuestions.length === 0) {
      alert('No tracks available for quiz');
      return;
    }
    
    setQuestions(newQuestions);
    setCurrentQuestionIndex(0);
    setCurrentQuestion(newQuestions[0]);
    setScreen('quiz');
  };

  const startQuestion = async () => {
    if (!currentQuestion) return;
    
    // Stop any existing audio
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    
    // Create new audio element
    const newAudio = new Audio(currentQuestion.track.previewUrl);
    setAudio(newAudio);
    
    // Auto-stop after 30 seconds
    autoStopRef.current = window.setTimeout(() => {
      stopMusic();
    }, 30000);
  };

  const handlePlayPause = async () => {
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  const stopMusic = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    }
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
    }
  };

  const showAnswerFeedback = (status: 'correct' | 'incorrect' | 'skipped') => {
    stopMusic();
    
    let message = '';
    let type: 'correct' | 'incorrect' | 'neutral' = 'neutral';
    
    switch (status) {
      case 'correct':
        message = 'Correct! 🎉';
        type = 'correct';
        break;
      case 'incorrect':
        message = `Incorrect. The answer was ${currentQuestion?.correctAnswer}`;
        type = 'incorrect';
        break;
      case 'skipped':
        message = `Skipped. The answer was ${currentQuestion?.correctAnswer}`;
        type = 'neutral';
        break;
    }
    
    setFeedbackMessage(message);
    setFeedbackType(type);
    setShowFeedback(true);
    
    setTimeout(() => {
      setShowFeedback(false);
      handleNextQuestion();
    }, 2000);
  };

  const handleAnswer = async (selectedAnswer: string) => {
    if (!currentQuestion) return;
    
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const status = isCorrect ? 'correct' : 'incorrect';
    
    // Update question status
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex] = {
      ...currentQuestion,
      userAnswer: selectedAnswer,
      status,
    };
    setQuestions(updatedQuestions);
    
    showAnswerFeedback(status);
  };

  const handleSkip = () => {
    if (!currentQuestion) return;
    
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex] = {
      ...currentQuestion,
      status: 'skipped',
    };
    setQuestions(updatedQuestions);
    
    showAnswerFeedback('skipped');
  };

  const handleNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex >= questions.length) {
      finishQuiz();
    } else {
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(questions[nextIndex]);
    }
  };

  const finishQuiz = async () => {
    const correct = questions.filter(q => q.status === 'correct').length;
    const incorrect = questions.filter(q => q.status === 'incorrect').length;
    const skipped = questions.filter(q => q.status === 'skipped').length;
    
    const quizData = {
      date: new Date().toISOString().split('T')[0],
      correct,
      incorrect,
      skipped,
      total: questions.length,
    };
    
    // Save to localStorage
    try {
      const existingHistory = localStorage.getItem(QUIZ_HISTORY_KEY);
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      history.push(quizData);
      localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(history));
      
      // Update daily data
      const dailyData = {
        date: quizData.date,
        questionsAnswered: questions.length,
        correct,
        incorrect,
        skipped,
      };
      localStorage.setItem(DAILY_QUIZ_KEY, JSON.stringify(dailyData));
      setDailyData(dailyData);
      
      // Update progress in backend
      if (user?.uid) {
        await updateProgress(quizData);
      }
    } catch (error) {
      console.error('Error saving quiz data:', error);
    }
    
    setScreen('results');
  };

  const renderStartScreen = () => (
    <div style={{ padding: 20, textAlign: 'center' }}>
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
      
      <button
        onClick={handleStartQuiz}
        disabled={loading || tracks.length === 0}
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
        }}
      >
        {loading ? 'Loading...' : 'Start Quiz'}
      </button>
    </div>
  );

  const renderQuizScreen = () => {
    if (!currentQuestion) return null;
    
    return (
      <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </h2>
          <p style={{ color: '#666' }}>Listen to the song and identify the artist</p>
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
              onClick={stopMusic}
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
        
        {showFeedback && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: feedbackType === 'correct' ? '#10B981' : feedbackType === 'incorrect' ? '#DC2626' : '#6B7280',
            color: '#fff',
            padding: '16px 24px',
            borderRadius: 8,
            fontSize: 18,
            fontWeight: 'bold',
            zIndex: 1000,
          }}>
            {feedbackMessage}
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
      <div style={{ padding: 20, textAlign: 'center' }}>
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

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      {screen === 'start' && renderStartScreen()}
      {screen === 'quiz' && renderQuizScreen()}
      {screen === 'results' && renderResultsScreen()}
    </div>
  );
};

export default ChecklistScreen; 