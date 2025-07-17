import React, { createContext, useState, ReactNode } from 'react';
import TrackPlayer from 'react-native-track-player';

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
}

interface QuizContextType {
  quizState: QuizState | null;
  setQuizState: React.Dispatch<React.SetStateAction<QuizState | null>>;
}

export const QuizContext = createContext<QuizContextType>({
  quizState: null,
  setQuizState: () => {},
});

interface QuizProviderProps {
  children: ReactNode;
}

export const QuizProvider: React.FC<QuizProviderProps> = ({ children }) => {
  const [quizState, setQuizState] = useState<QuizState | null>(null);

  return (
    <QuizContext.Provider value={{ quizState, setQuizState }}>
      {children}
    </QuizContext.Provider>
  );
}; 