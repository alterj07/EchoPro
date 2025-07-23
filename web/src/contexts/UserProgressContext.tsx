import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import apiService from '../services/apiService';

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
      // Try to get user progress from backend
      const progress = await apiService.getUserProgress(user.uid, 'all-time');
      setUserProgress(progress);
    } catch (error) {
      console.error('Error fetching user progress from backend:', error);
      // Fallback to localStorage if backend fails
      try {
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
      } catch (localError) {
        console.error('Error with localStorage fallback:', localError);
        setUserProgress(null);
      }
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
      // Try to update progress in backend
      const updatedProgress = await apiService.updateUserProgress(user.uid, quizData);
      setUserProgress(updatedProgress);
    } catch (error) {
      console.error('Error updating progress in backend:', error);
      // Fallback to localStorage if backend fails
      try {
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
      } catch (localError) {
        console.error('Error with localStorage fallback:', localError);
      }
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