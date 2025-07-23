import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface UserProgress {
  overallStats: {
    totalQuizzesTaken: number;
    overallAccuracy: number;
    currentStreak: number;
    bestQuizScore: number;
    totalQuestionsAnswered: number;
    totalTimeSpent: number;
  };
}

interface UserProgressContextType {
  userProgress: UserProgress | null;
  loading: boolean;
  refreshProgress: () => Promise<void>;
  updateProgress: (quizData: any) => Promise<void>;
}

const UserProgressContext = createContext<UserProgressContextType | undefined>(undefined);

interface UserProgressProviderProps {
  children: ReactNode;
}

export const UserProgressProvider: React.FC<UserProgressProviderProps> = ({ children }) => {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchUserProgress = async () => {
    if (!user?.uid) {
      setUserProgress(null);
      return;
    }

    setLoading(true);
    try {
      // For web, we'll use localStorage to simulate progress data
      const storedProgress = localStorage.getItem(`userProgress_${user.uid}`);
      if (storedProgress) {
        setUserProgress(JSON.parse(storedProgress));
      } else {
        // Default progress data
        const defaultProgress: UserProgress = {
          overallStats: {
            totalQuizzesTaken: 0,
            overallAccuracy: 0,
            currentStreak: 0,
            bestQuizScore: 0,
            totalQuestionsAnswered: 0,
            totalTimeSpent: 0
          }
        };
        setUserProgress(defaultProgress);
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
      setUserProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProgress = async () => {
    await fetchUserProgress();
  };

  const updateProgress = async (quizData: any) => {
    if (!user?.uid) return;

    try {
      // For web, we'll update localStorage
      const currentProgress = userProgress || {
        overallStats: {
          totalQuizzesTaken: 0,
          overallAccuracy: 0,
          currentStreak: 0,
          bestQuizScore: 0,
          totalQuestionsAnswered: 0,
          totalTimeSpent: 0
        }
      };

      // Update progress based on quiz data
      const updatedProgress = {
        ...currentProgress,
        overallStats: {
          ...currentProgress.overallStats,
          totalQuizzesTaken: currentProgress.overallStats.totalQuizzesTaken + 1,
          totalQuestionsAnswered: currentProgress.overallStats.totalQuestionsAnswered + (quizData.total || 0),
          totalTimeSpent: currentProgress.overallStats.totalTimeSpent + (quizData.timeSpent || 0)
        }
      };

      localStorage.setItem(`userProgress_${user.uid}`, JSON.stringify(updatedProgress));
      setUserProgress(updatedProgress);
    } catch (error) {
      console.error('Error updating progress:', error);
      await fetchUserProgress();
    }
  };

  useEffect(() => {
    fetchUserProgress();
  }, [user?.uid]);

  const value: UserProgressContextType = {
    userProgress,
    loading,
    refreshProgress,
    updateProgress,
  };

  return (
    <UserProgressContext.Provider value={value}>
      {children}
    </UserProgressContext.Provider>
  );
};

export const useUserProgress = (): UserProgressContextType => {
  const context = useContext(UserProgressContext);
  if (context === undefined) {
    throw new Error('useUserProgress must be used within a UserProgressProvider');
  }
  return context;
}; 