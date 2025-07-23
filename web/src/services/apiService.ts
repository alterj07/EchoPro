const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      // Don't throw the error, let the calling code handle the fallback
      throw error;
    }
  }

  // Helper method to check if backend is available
  private async isBackendAvailable(): Promise<boolean> {
    try {
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('Backend not available, using localStorage fallback');
      return false;
    }
  }

  // User endpoints
  async createUser(userId: string, name: string, email: string) {
    try {
      if (await this.isBackendAvailable()) {
        return this.makeRequest('/users/create', {
          method: 'POST',
          body: JSON.stringify({ userId, name, email }),
        });
      }
    } catch (error) {
      console.log('Failed to create user in backend, using localStorage fallback');
    }
    
    // Fallback to localStorage
    const user = { userId, name, email };
    localStorage.setItem(`user_${userId}`, JSON.stringify(user));
    return user;
  }

  async getUser(userId: string) {
    try {
      if (await this.isBackendAvailable()) {
        return this.makeRequest(`/users/${userId}`);
      }
    } catch (error) {
      console.log('Failed to get user from backend, using localStorage fallback');
    }
    
    // Fallback to localStorage
    const userData = localStorage.getItem(`user_${userId}`);
    return userData ? JSON.parse(userData) : null;
  }

  async updateUserProgress(userId: string, quizData: any) {
    try {
      if (await this.isBackendAvailable()) {
        const backendProgress = await this.makeRequest(`/users/${userId}/progress`, {
          method: 'POST',
          body: JSON.stringify({ period: 'daily', quizData }),
        });
        // Convert backend format to expected format
        return {
          overallStats: {
            totalQuizzesTaken: backendProgress.totalQuizzes || 0,
            overallAccuracy: backendProgress.totalQuestions > 0 ? (backendProgress.correctAnswers / backendProgress.totalQuestions) * 100 : 0,
            currentStreak: backendProgress.currentStreak || 0,
            bestQuizScore: backendProgress.bestQuizScore || 0,
            totalQuestionsAnswered: backendProgress.totalQuestions || 0,
            totalTimeSpent: backendProgress.totalTimeSpent || 0
          }
        };
      }
    } catch (error) {
      console.log('Failed to update user progress in backend, using localStorage fallback');
    }
    
    // Fallback to localStorage
    const progressKey = `progress_${userId}_daily`;
    const existingProgress = localStorage.getItem(progressKey);
    let progress;
    
    if (existingProgress) {
      const parsed = JSON.parse(existingProgress);
      if (parsed.overallStats) {
        progress = parsed;
      } else {
        // Convert old format
        progress = {
          overallStats: {
            totalQuizzesTaken: parsed.totalQuizzes || 0,
            overallAccuracy: parsed.totalQuestions > 0 ? (parsed.correctAnswers / parsed.totalQuestions) * 100 : 0,
            currentStreak: parsed.currentStreak || 0,
            bestQuizScore: parsed.bestQuizScore || 0,
            totalQuestionsAnswered: parsed.totalQuestions || 0,
            totalTimeSpent: parsed.totalTimeSpent || 0
          }
        };
      }
    } else {
      progress = {
        overallStats: {
          totalQuizzesTaken: 0,
          overallAccuracy: 0,
          currentStreak: 0,
          bestQuizScore: 0,
          totalQuestionsAnswered: 0,
          totalTimeSpent: 0
        }
      };
    }
    
    // Update progress
    progress.overallStats.totalQuizzesTaken += 1;
    progress.overallStats.totalQuestionsAnswered += quizData.totalQuestions || 0;
    progress.overallStats.totalTimeSpent += quizData.timeSpent || 0;
    
    // Update accuracy
    if (progress.overallStats.totalQuestionsAnswered > 0) {
      const correctAnswers = (progress.overallStats.overallAccuracy / 100) * (progress.overallStats.totalQuestionsAnswered - (quizData.totalQuestions || 0)) + (quizData.correct || 0);
      progress.overallStats.overallAccuracy = (correctAnswers / progress.overallStats.totalQuestionsAnswered) * 100;
    }
    
    localStorage.setItem(progressKey, JSON.stringify(progress));
    return progress;
  }

  async getUserProgress(userId: string, period: string) {
    try {
      if (await this.isBackendAvailable()) {
        const backendProgress = await this.makeRequest(`/users/${userId}/progress/${period}`);
        // Convert backend format to expected format
        return {
          overallStats: {
            totalQuizzesTaken: backendProgress.totalQuizzes || 0,
            overallAccuracy: backendProgress.totalQuestions > 0 ? (backendProgress.correctAnswers / backendProgress.totalQuestions) * 100 : 0,
            currentStreak: backendProgress.currentStreak || 0,
            bestQuizScore: backendProgress.bestQuizScore || 0,
            totalQuestionsAnswered: backendProgress.totalQuestions || 0,
            totalTimeSpent: backendProgress.totalTimeSpent || 0
          }
        };
      }
    } catch (error) {
      console.log('Failed to get user progress from backend, using localStorage fallback');
    }
    
    // Fallback to localStorage
    const progressKey = `progress_${userId}_${period}`;
    const progressData = localStorage.getItem(progressKey);
    if (progressData) {
      const parsed = JSON.parse(progressData);
      // Ensure it has the expected structure
      if (parsed.overallStats) {
        return parsed;
      } else {
        // Convert old format to new format
        return {
          overallStats: {
            totalQuizzesTaken: parsed.totalQuizzes || 0,
            overallAccuracy: parsed.totalQuestions > 0 ? (parsed.correctAnswers / parsed.totalQuestions) * 100 : 0,
            currentStreak: parsed.currentStreak || 0,
            bestQuizScore: parsed.bestQuizScore || 0,
            totalQuestionsAnswered: parsed.totalQuestions || 0,
            totalTimeSpent: parsed.totalTimeSpent || 0
          }
        };
      }
    }
    
    // Default structure
    return {
      overallStats: {
        totalQuizzesTaken: 0,
        overallAccuracy: 0,
        currentStreak: 0,
        bestQuizScore: 0,
        totalQuestionsAnswered: 0,
        totalTimeSpent: 0
      }
    };
  }

  // Checklist endpoints
  async submitChecklist(userId: string, answers: any[], totalQuestions: number, correctCount: number, skipCount: number, percentage: number) {
    try {
      if (await this.isBackendAvailable()) {
        return this.makeRequest('/checklist/submit', {
          method: 'POST',
          body: JSON.stringify({
            userId,
            answers,
            totalQuestions,
            correctCount,
            skipCount,
            percentage,
          }),
        });
      }
    } catch (error) {
      console.log('Failed to submit checklist to backend, using localStorage fallback');
    }
    
    // Fallback to localStorage
    const checklistData = {
      userId,
      answers,
      totalQuestions,
      correctCount,
      skipCount,
      percentage,
      completedAt: new Date().toISOString(),
    };
    
    const checklists = JSON.parse(localStorage.getItem(`checklists_${userId}`) || '[]');
    checklists.push(checklistData);
    localStorage.setItem(`checklists_${userId}`, JSON.stringify(checklists));
    
    return { success: true, result: checklistData };
  }

  async getDashboardData(userId: string, period: string) {
    try {
      if (await this.isBackendAvailable()) {
        return this.makeRequest(`/checklist/dashboard/${userId}/${period}`);
      }
    } catch (error) {
      console.log('Failed to get dashboard data from backend, using localStorage fallback');
    }
    
    // Fallback to localStorage
    const checklists = JSON.parse(localStorage.getItem(`checklists_${userId}`) || '[]');
    const now = new Date();
    let filteredChecklists = checklists;
    
    // Filter by period
    switch (period) {
      case 'day':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filteredChecklists = checklists.filter((c: any) => new Date(c.completedAt) >= today);
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredChecklists = checklists.filter((c: any) => new Date(c.completedAt) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        filteredChecklists = checklists.filter((c: any) => new Date(c.completedAt) >= monthAgo);
        break;
      case 'year':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        filteredChecklists = checklists.filter((c: any) => new Date(c.completedAt) >= yearAgo);
        break;
    }
    
    const totalPercent = filteredChecklists.length > 0 
      ? filteredChecklists.reduce((sum: number, c: any) => sum + c.percentage, 0) / filteredChecklists.length 
      : 0;
    
    const history = filteredChecklists.map((c: any) => ({
      date: new Date(c.completedAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      correct: `${c.correctCount}/${c.totalQuestions}`,
      skip: c.skipCount,
      percent: c.percentage,
      color: c.percentage >= 80 ? '#4ade80' : c.percentage >= 60 ? '#fbbf24' : '#f87171'
    }));
    
    return {
      period,
      percent: Math.round(totalPercent),
      history
    };
  }

  async getRecentResults(userId: string, limit: number = 10) {
    try {
      if (await this.isBackendAvailable()) {
        return this.makeRequest(`/checklist/recent/${userId}?limit=${limit}`);
      }
    } catch (error) {
      console.log('Failed to get recent results from backend, using localStorage fallback');
    }
    
    // Fallback to localStorage
    const checklists = JSON.parse(localStorage.getItem(`checklists_${userId}`) || '[]');
    return checklists.slice(-limit).reverse();
  }
}

export default new ApiService(); 