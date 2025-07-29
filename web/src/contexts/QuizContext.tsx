import { createContext, useState, useCallback, useContext } from 'react';
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

interface QuizContextType {
  quizState: QuizState | null;
  setQuizState: React.Dispatch<React.SetStateAction<QuizState | null>>;
  updateQuizProgress: (questionIndex: number, answer: string, isCorrect: boolean) => void;
  getTodayLiveProgress: (userId: string) => Promise<{correct: number, incorrect: number, skipped: number, total: number, percent: number}>;
}

const QuizContext = createContext<QuizContextType>({
  quizState: null,
  setQuizState: () => {},
  updateQuizProgress: () => {},
  getTodayLiveProgress: async () => ({correct: 0, incorrect: 0, skipped: 0, total: 0, percent: 0}),
});

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const [quizState, setQuizState] = useState<QuizState | null>(null);

  // NEW: Get today's live progress from backend
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
          
          return {
            correct: correctAnswers || 0,
            incorrect: incorrectAnswers || 0,
            skipped: skippedAnswers || 0,
            total: total,
            percent: percent
          };
        }
      }
      // Return default values if no progress found
      return { correct: 0, incorrect: 0, skipped: 0, total: 0, percent: 0 };
    } catch (error) {
      console.error('Error getting today live progress:', error);
      return { correct: 0, incorrect: 0, skipped: 0, total: 0, percent: 0 };
    }
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
      getTodayLiveProgress
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