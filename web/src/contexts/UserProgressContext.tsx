import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { UserProgress } from '../services/progressService';

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
      const progressService = require('../services/progressService').default;
      progressService.setUserId(user.uid);
      const progress = await progressService.getAllProgress();
      setUserProgress(progress);
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
      const progressService = require('../services/progressService').default;
      progressService.setUserId(user.uid);
      const updatedProgress = await progressService.updateProgress(quizData);
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