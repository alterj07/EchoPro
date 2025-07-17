import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export interface QuizData {
  quizId?: string;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  skipped: number;
  timeSpent?: number; // in seconds
}

export interface ProgressStats {
  totalQuizzes: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  streakDays: number;
  currentStreak: number;
  longestStreak: number;
}

export interface ProgressHistory {
  date: Date;
  quizId: string;
  questionsAnswered: number;
  correct: number;
  incorrect: number;
  skipped: number;
  score: number;
  timeSpent: number;
}

export interface ProgressData {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all-time';
  startDate: Date;
  endDate: Date;
  stats: ProgressStats;
  history: ProgressHistory[];
  lastUpdated: Date;
}

export interface OverallStats {
  totalQuizzesTaken: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  totalIncorrectAnswers: number;
  totalSkippedAnswers: number;
  overallAccuracy: number;
  averageQuizScore: number;
  bestQuizScore: number;
  totalTimeSpent: number;
  currentStreak: number;
  longestStreak: number;
  lastQuizDate: Date | null;
}

export interface UserProgress {
  overallStats: OverallStats;
  progress: {
    daily?: ProgressData;
    weekly?: ProgressData;
    monthly?: ProgressData;
    yearly?: ProgressData;
    'all-time'?: ProgressData;
  };
}

export interface LeaderboardEntry {
  name: string;
  stats: {
    overallAccuracy?: number;
    totalQuizzesTaken?: number;
    currentStreak?: number;
    longestStreak?: number;
  };
  profile: {
    avatar?: string;
  };
}

class ProgressService {
  private userId: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }

  // Update user progress after completing a quiz
  async updateProgress(quizData: QuizData): Promise<UserProgress> {
    if (!this.userId) {
      throw new Error('User ID not set');
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/users/${this.userId}/progress`,
        {
          period: 'all', // This will update all periods
          quizData
        },
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Error updating progress:', error);
      throw new Error('Failed to update progress');
    }
  }

  // Get progress for a specific period
  async getProgress(period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all-time'): Promise<ProgressData> {
    if (!this.userId) {
      throw new Error('User ID not set');
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/users/${this.userId}/progress/${period}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error(`Error getting ${period} progress:`, error);
      throw new Error(`Failed to get ${period} progress`);
    }
  }

  // Get all progress data
  async getAllProgress(): Promise<UserProgress> {
    if (!this.userId) {
      throw new Error('User ID not set');
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/users/${this.userId}/progress`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting all progress:', error);
      throw new Error('Failed to get progress data');
    }
  }

  // Get leaderboard by accuracy
  async getAccuracyLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/users/leaderboard/accuracy?limit=${limit}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting accuracy leaderboard:', error);
      throw new Error('Failed to get leaderboard');
    }
  }

  // Get leaderboard by streak
  async getStreakLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/users/leaderboard/streak?limit=${limit}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting streak leaderboard:', error);
      throw new Error('Failed to get leaderboard');
    }
  }

  // Update user preferences
  async updatePreferences(preferences: any): Promise<any> {
    if (!this.userId) {
      throw new Error('User ID not set');
    }

    try {
      console.log('preferences', preferences);
      console.log('this.userId', this.userId);
      console.log(`${API_BASE_URL}/users/preferences/${this.userId}`);
      const response = await axios.put(
        `${API_BASE_URL}/users/${this.userId}/preferences`,
        { preferences },
        { headers: this.getHeaders() }
      );
      console.log('response', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw new Error('Failed to update preferences');
    }
  }

  // Update user profile
  async updateProfile(profile: any): Promise<any> {
    if (!this.userId) {
      throw new Error('User ID not set');
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/users/${this.userId}/profile`,
        { profile },
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  // Helper method to format time spent
  formatTimeSpent(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  // Helper method to calculate streak
  calculateStreak(history: ProgressHistory[]): { currentStreak: number; longestStreak: number } {
    if (history.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Sort history by date (most recent first)
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (const entry of sortedHistory) {
      const entryDate = new Date(entry.date);
      const entryDateStr = entryDate.toDateString();

      if (lastDate === null) {
        // First entry
        tempStreak = 1;
        currentStreak = 1;
      } else {
        const lastDateStr = lastDate.toDateString();
        const dayDiff = Math.floor((lastDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
          // Consecutive day
          tempStreak++;
          if (tempStreak === 1) {
            currentStreak = tempStreak;
          }
        } else if (dayDiff > 1) {
          // Gap in streak
          tempStreak = 1;
        }
      }

      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }

      lastDate = entryDate;
    }

    return { currentStreak, longestStreak };
  }

  // Helper method to get period display name
  getPeriodDisplayName(period: string): string {
    const periodNames = {
      daily: 'Today',
      weekly: 'This Week',
      monthly: 'This Month',
      yearly: 'This Year',
      'all-time': 'All Time'
    };
    return periodNames[period as keyof typeof periodNames] || period;
  }

  // Helper method to get period color
  getPeriodColor(period: string): string {
    const periodColors = {
      daily: '#4CAF50',
      weekly: '#2196F3',
      monthly: '#9C27B0',
      yearly: '#FF9800',
      'all-time': '#607D8B'
    };
    return periodColors[period as keyof typeof periodColors] || '#666666';
  }
}

export const progressService = new ProgressService();
export default progressService; 