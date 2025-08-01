import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import apiService from '../services/apiService';

interface User {
  uid: string;
  email: string | null;
}

interface TodayProgress {
  correct: number;
  incorrect: number;
  skipped: number;
  total: number;
  percent: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  todayProgress: TodayProgress;
  updateTodayProgress: (correct: number, incorrect: number, skipped: number) => void;
  loadTodayProgressFromBackend: (userId: string) => Promise<void>;
  saveTodayProgressToBackend: (userId: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  googleSignIn: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayProgress, setTodayProgress] = useState<TodayProgress>({
    correct: 0,
    incorrect: 0,
    skipped: 0,
    total: 0,
    percent: 0
  });

  useEffect(() => {
    // Check for existing user in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Load today's progress from localStorage if available
      const storedProgress = localStorage.getItem(`todayProgress_${parsedUser.uid}`);
      if (storedProgress) {
        try {
          const progress = JSON.parse(storedProgress);
          setTodayProgress(progress);
          console.log('AuthContext - Loaded today progress from localStorage:', progress);
        } catch (error) {
          console.error('Error loading today progress from localStorage:', error);
        }
      }
    }
    setLoading(false);
  }, []);

  // Update today's progress locally
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
    
    console.log('AuthContext - Updating today progress:', newProgress);
    setTodayProgress(newProgress);
    
    // Save to localStorage if user is logged in
    if (user?.uid) {
      try {
        localStorage.setItem(`todayProgress_${user.uid}`, JSON.stringify(newProgress));
        console.log('AuthContext - Saved today progress to localStorage');
      } catch (error) {
        console.error('Error saving today progress to localStorage:', error);
      }
    }
  }, [user?.uid]);

  // Load today's progress from backend
  const loadTodayProgressFromBackend = useCallback(async (userId: string) => {
    try {
      const userData = await apiService.getUser(userId);
      if (userData && userData.progress && userData.progress.length > 0) {
        const todayProgress = userData.progress.find((p: any) => p.period === 'daily');
        if (todayProgress && todayProgress.stats) {
          const { correctAnswers, incorrectAnswers, skippedAnswers, totalQuestions } = todayProgress.stats;
          const total = totalQuestions || 0;
          const percent = total > 0 ? (correctAnswers / total) * 100 : 0;
          
          const progress = {
            correct: correctAnswers || 0,
            incorrect: incorrectAnswers || 0,
            skipped: skippedAnswers || 0,
            total: total,
            percent: percent
          };
          
          console.log('AuthContext - Loaded today progress from backend:', progress);
          setTodayProgress(progress);
          
          // Save to localStorage
          try {
            localStorage.setItem(`todayProgress_${userId}`, JSON.stringify(progress));
            console.log('AuthContext - Saved today progress to localStorage from backend');
          } catch (error) {
            console.error('Error saving today progress to localStorage:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading today progress from backend:', error);
    }
  }, []);

  // Save today's progress to backend
  const saveTodayProgressToBackend = useCallback(async (userId: string) => {
    try {
      console.log('AuthContext - saveTodayProgressToBackend called with userId:', userId);
      console.log('AuthContext - Current todayProgress:', todayProgress);
      
      await apiService.saveQuizState(userId, [], 0, {
        correct: todayProgress.correct,
        incorrect: todayProgress.incorrect,
        skipped: todayProgress.skipped
      });
      console.log('AuthContext - Saved today progress to backend:', todayProgress);
    } catch (error) {
      console.error('Error saving today progress to backend:', error);
    }
  }, [todayProgress]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Validate credentials against MongoDB database
      const validationResponse = await apiService.validateLogin(email, password);
      console.log('Login successful:', validationResponse);
      
      // Create a mock user object from the MongoDB user data
      const mongoUser = validationResponse.user;
      const mockUser: User = {
        uid: mongoUser.userId,
        email: mongoUser.email
      };
      
      // Clear any existing quiz state before setting the new user
      if (user?.uid && user.uid !== mockUser.uid) {
        try {
          const key = `quizState_${user.uid}`;
          localStorage.removeItem(key);
          console.log('Cleared quiz state for previous user:', user.uid);
        } catch (error) {
          console.error('Error clearing previous user quiz state:', error);
        }
      }
      
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      setUser(mockUser);
      
      // Load today's progress from backend
      await loadTodayProgressFromBackend(mockUser.uid);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      // Check if email already exists in localStorage (for web mock)
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      if (existingUsers.find((user: any) => user.email === email)) {
        throw new Error('An account with this email address already exists. Please sign in instead.');
      }
      
      // Create user in MongoDB with password
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await apiService.createUser(userId, name, email, password); // Pass actual name
      console.log('User created in MongoDB:', response);
      
      // Clear any existing progress data for the new user to ensure fresh start
      try {
        await apiService.clearUserProgress(userId);
        console.log('Cleared progress data for new user:', userId);
      } catch (error) {
        console.error('Error clearing progress for new user:', error);
      }
      
      // Add to localStorage for web mock
      existingUsers.push({ email, userId });
      localStorage.setItem('users', JSON.stringify(existingUsers));
      
      // Create a mock user object
      const mockUser: User = {
        uid: userId,
        email: email
      };
      
      // Clear any existing quiz state before setting the new user
      if (user?.uid && user.uid !== mockUser.uid) {
        try {
          const key = `quizState_${user.uid}`;
          localStorage.removeItem(key);
          console.log('Cleared quiz state for previous user:', user.uid);
        } catch (error) {
          console.error('Error clearing previous user quiz state:', error);
        }
      }
      
      // Also clear any existing quiz state for the new user to ensure fresh start
      try {
        const newUserKey = `quizState_${mockUser.uid}`;
        localStorage.removeItem(newUserKey);
        console.log('Cleared any existing quiz state for new user:', mockUser.uid);
      } catch (error) {
        console.error('Error clearing new user quiz state:', error);
      }
      
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Save today's progress to backend before signing out
      if (user?.uid) {
        await saveTodayProgressToBackend(user.uid);
        
        try {
          // Clear quiz state from localStorage
          const key = `quizState_${user.uid}`;
          localStorage.removeItem(key);
          console.log('Quiz state cleared for user:', user.uid);
        } catch (error) {
          console.error('Error clearing quiz state:', error);
        }
      }
      
      localStorage.removeItem('currentUser');
      setUser(null);
      
      // Reset today's progress
      setTodayProgress({
        correct: 0,
        incorrect: 0,
        skipped: 0,
        total: 0,
        percent: 0
      });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const googleSignIn = async () => {
    setLoading(true);
    try {
      // Mock Google sign in for web
      const mockUser: User = {
        uid: `google_user_${Date.now()}`,
        email: 'user@gmail.com'
      };
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, todayProgress, updateTodayProgress, loadTodayProgressFromBackend, saveTodayProgressToBackend, signIn, signUp, signOut, googleSignIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 




