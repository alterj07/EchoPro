import { createContext, useState, useCallback, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import apiService from '../services/apiService';

export interface ITunesTrack {
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

export interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  quizId?: string;
  startTime?: number;
}

// Local state for today's progress
interface TodayProgress {
  correct: number;
  incorrect: number;
  skipped: number;
  total: number;
  percent: number;
}

interface QuizContextType {
  quizState: QuizState | null;
  setQuizState: React.Dispatch<React.SetStateAction<QuizState | null>>;
  updateQuizProgress: (questionIndex: number, answer: string, isCorrect: boolean) => void;
  getTodayLiveProgress: (userId: string) => Promise<{correct: number, incorrect: number, skipped: number, total: number, percent: number}>;
  todayProgress: TodayProgress;
  updateTodayProgress: (correct: number, incorrect: number, skipped: number) => void;
}

const QuizContext = createContext<QuizContextType>({
  quizState: null,
  setQuizState: () => {},
  updateQuizProgress: () => {},
  getTodayLiveProgress: async () => ({correct: 0, incorrect: 0, skipped: 0, total: 0, percent: 0}),
  todayProgress: { correct: 0, incorrect: 0, skipped: 0, total: 0, percent: 0 },
  updateTodayProgress: () => {},
});

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [todayProgress, setTodayProgress] = useState<TodayProgress>({
    correct: 0,
    incorrect: 0,
    skipped: 0,
    total: 0,
    percent: 0
  });

  // Save progress when window is closed or page is unloaded
  useEffect(() => {
    const handleBeforeUnload = () => {
      // This will be called when the window is closed or page is refreshed
      // Note: We can't make async calls here, but we can try to save synchronously
      console.log('Window closing, today progress:', todayProgress);
    };

    const handlePageHide = () => {
      // This is called when the page is hidden (tab switch, close, etc.)
      console.log('Page hiding, today progress:', todayProgress);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [todayProgress]);

  // Load today's progress from backend on login
  const getTodayLiveProgress = useCallback(async (userId: string) => {
    try {
      const userData = await apiService.getUser(userId);
      if (userData && userData.progress && userData.progress.length > 0) {
        // Find today's progress (progress[0] should be daily)
        const todayProgress = userData.progress.find((p: any) => p.period === 'daily');
        if (todayProgress && todayProgress.stats) {
          const { correctAnswers, incorrectAnswers, skippedAnswers, totalQuestions } = todayProgress.stats;
          const total = correctAnswers + incorrectAnswers + skippedAnswers;
          const percent = total > 0 ? (correctAnswers / total) * 100 : 0;
          
          const progress = {
            correct: correctAnswers || 0,
            incorrect: incorrectAnswers || 0,
            skipped: skippedAnswers || 0,
            total: total,
            percent: percent
          };
          
          // Update local state with backend data
          setTodayProgress(progress);
          return progress;
        }
      }
      // Return default values if no progress found
      const defaultProgress = { correct: 0, incorrect: 0, skipped: 0, total: 0, percent: 0 };
      setTodayProgress(defaultProgress);
      return defaultProgress;
    } catch (error) {
      console.error('Error getting today live progress:', error);
      const defaultProgress = { correct: 0, incorrect: 0, skipped: 0, total: 0, percent: 0 };
      setTodayProgress(defaultProgress);
      return defaultProgress;
    }
  }, []);

  // Update today's progress locally (no API call)
  const updateTodayProgress = useCallback((correct: number, incorrect: number, skipped: number) => {
    const total = correct + incorrect + skipped;
    const percent = total > 0 ? (correct / total) * 100 : 0;
    
    const newProgress = {
      correct,
      incorrect,
      skipped,
      total,
      percent
    };
    
    console.log('QuizContext - Updating today progress:', newProgress);
    console.log('QuizContext - Previous state:', todayProgress);
    setTodayProgress(newProgress);
    console.log('QuizContext - State update triggered');
  }, []);

  const updateQuizProgress = (questionIndex: number, answer: string, isCorrect: boolean) => {
    if (!quizState) return;

    const updatedQuestions = [...quizState.questions];
    const question = updatedQuestions[questionIndex];
    
    if (question) {
      question.userAnswer = answer;
      question.status = isCorrect ? 'correct' : 'incorrect';
    }

    const newCorrectCount = updatedQuestions.filter(q => q.status === 'correct').length;
    const newIncorrectCount = updatedQuestions.filter(q => q.status === 'incorrect').length;
    const newSkippedCount = updatedQuestions.filter(q => q.status === 'skipped').length;

    setQuizState({
      ...quizState,
      questions: updatedQuestions,
      correctCount: newCorrectCount,
      incorrectCount: newIncorrectCount,
      skippedCount: newSkippedCount,
    });
  };

  return (
    <QuizContext.Provider value={{
      quizState,
      setQuizState,
      updateQuizProgress,
      getTodayLiveProgress,
      todayProgress,
      updateTodayProgress,
    }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}; 