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
      const progress = await apiService.getUserProgress(user.uid, 'all-time');
      if (progress && progress.overallStats) {
        setUserProgress(progress);
      } else {
        throw new Error('Invalid progress data structure from backend');
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
      // Set default progress if fetch fails
      setUserProgress({
        overallStats: {
          totalQuizzesTaken: 0,
          overallAccuracy: 0,
          currentStreak: 0,
          bestQuizScore: 0,
          totalQuestionsAnswered: 0,
          totalTimeSpent: 0
        }
      });
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
      const updatedProgress = await apiService.updateUserProgress(user.uid, quizData);
      setUserProgress(updatedProgress);
    } catch (error) {
      console.error('Error updating progress:', error);
      // Refresh progress to get latest data
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