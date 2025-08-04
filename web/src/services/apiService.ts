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
      throw error;
    }
  }

  // User endpoints
  async createUser(userId: string, name: string, email: string, password?: string) {
    try {
      const body: any = { userId, name, email };
      if (password) {
        body.password = password;
      }
      
      const response = await this.makeRequest('/users/create', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return response;
    } catch (error: any) {
      if (error.message && error.message.includes('Email already exists')) {
        throw new Error('An account with this email address already exists. Please sign in instead.');
      }
      throw error;
    }
  }

  async getUser(userId: string) {
    try {
      const response = await this.makeRequest(`/users/${userId}`, {
        method: 'GET',
      });
      return response;
    } catch (error: any) {
      if (error.message && error.message.includes('404')) {
        throw new Error('User not found');
      }
      throw error;
    }
  }

  async validateLogin(email: string, password: string) {
    try {
      const response = await this.makeRequest('/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return response;
    } catch (error: any) {
      if (error.message && error.message.includes('404')) {
        throw new Error('No account found with this email address. Please sign up instead.');
      }
      if (error.message && error.message.includes('401')) {
        throw new Error('Invalid email or password. Please try again.');
      }
      throw error;
    }
  }

  async clearUserProgress(userId: string) {
    try {
      const response = await this.makeRequest(`/users/${userId}/progress`, {
        method: 'DELETE',
      });
      return response;
    } catch (error: any) {
      console.error('Error clearing user progress:', error);
      throw error;
    }
  }

  async saveQuizState(userId: string, questions: any[], currentQuestionIndex: number, dailyStats?: any) {
    try {
      // Ensure the data is serializable
      const payload = {
        questions: questions || [],
        currentQuestionIndex: currentQuestionIndex || 0,
        dailyStats: dailyStats || {}
      };
      
      console.log('Saving quiz state with payload:', {
        userId,
        questionsCount: questions?.length || 0,
        currentQuestionIndex,
        dailyStats
      });
      
      const response = await this.makeRequest(`/users/${userId}/quiz-state`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return response;
    } catch (error: any) {
      console.error('Error saving quiz state:', error);
      // Return a default response instead of throwing to prevent app crashes
      return {
        success: false,
        message: 'Failed to save quiz state',
        error: error.message
      };
    }
  }

  async clearQuizState(userId: string) {
    try {
      const response = await this.makeRequest(`/users/${userId}/quiz-state`, {
        method: 'DELETE',
      });
      return response;
    } catch (error: any) {
      console.error('Error clearing quiz state:', error);
      throw error;
    }
  }

  async updateUserProgress(userId: string, quizData: any) {
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

  async getUserProgress(userId: string, period: string) {
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

  // Checklist endpoints
  async submitChecklist(userId: string, answers: any[], totalQuestions: number, correctCount: number, skipCount: number, percentage: number) {
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

  async getDashboardData(userId: string, period: string) {
    try {
      // Get user data which includes progress
      const userData = await this.getUser(userId);
      console.log('getDashboardData - User data:', userData);
      console.log('getDashboardData - Progress:', userData?.progress);
      
      if (!userData || !userData.progress) {
        console.log('getDashboardData - No user data or progress found');
        return {
          period,
          history: [],
          totalQuizzes: 0,
          totalCorrect: 0,
          totalIncorrect: 0,
          totalSkipped: 0
        };
      }
      
      // Map period names
      const periodMap: { [key: string]: string } = {
        'day': 'daily',
        'week': 'weekly', 
        'month': 'monthly',
        'year': 'yearly',
        'all': 'all-time'
      };
      
      const backendPeriod = periodMap[period] || 'daily';
      console.log('getDashboardData - Looking for period:', backendPeriod);
      
      // Find the progress for the requested period
      const progress = userData.progress.find((p: any) => p.period === backendPeriod);
      console.log('getDashboardData - Found progress:', progress);
      
      if (!progress) {
        console.log('getDashboardData - No progress found for period:', backendPeriod);
        return {
          period,
          history: [],
          totalQuizzes: 0,
          totalCorrect: 0,
          totalIncorrect: 0,
          totalSkipped: 0
        };
      }
      
      // Convert progress data to dashboard format
      const { stats, history } = progress;
      console.log('getDashboardData - Stats:', stats);
      console.log('getDashboardData - History:', history);
      
      return {
        period,
        history: history || [],
        totalQuizzes: stats.totalQuizzes || 0,
        totalCorrect: stats.correctAnswers || 0,
        totalIncorrect: stats.incorrectAnswers || 0,
        totalSkipped: stats.skippedAnswers || 0
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return {
        period,
        history: [],
        totalQuizzes: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        totalSkipped: 0
      };
    }
  }

  async getRecentResults(userId: string, limit: number = 10) {
    return this.makeRequest(`/checklist/recent/${userId}?limit=${limit}`);
  }
}

export default new ApiService(); 