const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

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
  async createUser(userId: string, name: string, email: string) {
    return this.makeRequest('/users/create', {
      method: 'POST',
      body: JSON.stringify({ userId, name, email }),
    });
  }

  async getUser(userId: string) {
    return this.makeRequest(`/users/${userId}`);
  }

  async updateUserProgress(userId: string, quizData: any) {
    return this.makeRequest(`/users/${userId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ period: 'daily', quizData }),
    });
  }

  async getUserProgress(userId: string, period: string) {
    return this.makeRequest(`/users/${userId}/progress/${period}`);
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
    return this.makeRequest(`/checklist/dashboard/${userId}/${period}`);
  }

  async getRecentResults(userId: string, limit: number = 10) {
    return this.makeRequest(`/checklist/recent/${userId}?limit=${limit}`);
  }
}

export default new ApiService(); 