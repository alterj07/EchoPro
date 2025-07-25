import { createContext, useState } from 'react';
import type { ReactNode } from 'react';

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
  saveQuizState: (userId: string) => Promise<void>;
  loadQuizState: (userId: string) => Promise<QuizState | null>;
  clearQuizState: (userId: string) => Promise<void>;
  updateQuizProgress: (questionIndex: number, answer: string, isCorrect: boolean) => void;
}

export const QuizContext = createContext<QuizContextType>({
  quizState: null,
  setQuizState: () => {},
  saveQuizState: async () => {},
  loadQuizState: async () => null,
  clearQuizState: async () => {},
  updateQuizProgress: () => {},
});

interface QuizProviderProps {
  children: ReactNode;
}

export const QuizProvider: React.FC<QuizProviderProps> = ({ children }) => {
  const [quizState, setQuizState] = useState<QuizState | null>(null);

  const saveQuizState = async (userId: string) => {
    if (!quizState) return;
    
    try {
      const key = `quizState_${userId}`;
      localStorage.setItem(key, JSON.stringify(quizState));
    } catch (error) {
      console.error('Error saving quiz state:', error);
    }
  };

  const loadQuizState = async (userId: string): Promise<QuizState | null> => {
    try {
      const key = `quizState_${userId}`;
      const savedState = localStorage.getItem(key);
      
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Check if the saved state is from today
        const today = new Date().toISOString().split('T')[0];
        const savedDate = new Date(parsedState.startTime || Date.now()).toISOString().split('T')[0];
        
        if (savedDate === today) {
          return parsedState;
        } else {
          // Clear old state if it's from a different day
          await clearQuizState(userId);
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading quiz state:', error);
      return null;
    }
  };

  const clearQuizState = async (userId: string) => {
    try {
      const key = `quizState_${userId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing quiz state:', error);
    }
  };

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
      saveQuizState, 
      loadQuizState, 
      clearQuizState,
      updateQuizProgress 
    }}>
      {children}
    </QuizContext.Provider>
  );
}; 