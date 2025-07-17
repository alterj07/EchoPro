// Example of a complete user object with comprehensive progress tracking data
// This demonstrates the structure of the enhanced User model

const exampleUser = {
  userId: "user_123456789",
  name: "John Doe",
  email: "john.doe@example.com",
  
  preferences: {
    fontSize: "medium",
    theme: "auto",
    notifications: true,
    dailyReminder: true,
    reminderTime: "09:00"
  },
  
  profile: {
    avatar: "https://example.com/avatar.jpg",
    bio: "Music enthusiast and 80s lover! 🎵",
    joinDate: "2024-01-15T10:30:00.000Z",
    lastActive: "2024-12-19T14:45:00.000Z"
  },
  
  achievements: [
    {
      id: "first_quiz",
      name: "First Steps",
      description: "Complete your first quiz",
      icon: "🎯",
      unlockedAt: "2024-01-15T11:00:00.000Z",
      progress: 1,
      maxProgress: 1
    },
    {
      id: "streak_7",
      name: "Week Warrior",
      description: "Maintain a 7-day streak",
      icon: "🔥",
      unlockedAt: "2024-01-22T10:00:00.000Z",
      progress: 7,
      maxProgress: 7
    },
    {
      id: "accuracy_90",
      name: "Sharp Shooter",
      description: "Achieve 90% accuracy in a quiz",
      icon: "🎯",
      unlockedAt: "2024-01-20T15:30:00.000Z",
      progress: 1,
      maxProgress: 1
    },
    {
      id: "quiz_master",
      name: "Quiz Master",
      description: "Complete 100 quizzes",
      icon: "👑",
      unlockedAt: null,
      progress: 45,
      maxProgress: 100
    }
  ],
  
  progress: [
    {
      period: "daily",
      startDate: "2024-12-19T00:00:00.000Z",
      endDate: "2024-12-19T23:59:59.000Z",
      stats: {
        totalQuizzes: 2,
        totalQuestions: 40,
        correctAnswers: 32,
        incorrectAnswers: 6,
        skippedAnswers: 2,
        averageScore: 80.0,
        bestScore: 85.0,
        worstScore: 75.0,
        streakDays: 1,
        currentStreak: 1,
        longestStreak: 1
      },
      history: [
        {
          date: "2024-12-19T10:30:00.000Z",
          quizId: "quiz_1702998600000",
          questionsAnswered: 20,
          correct: 17,
          incorrect: 2,
          skipped: 1,
          score: 85.0,
          timeSpent: 180 // 3 minutes
        },
        {
          date: "2024-12-19T14:45:00.000Z",
          quizId: "quiz_1703012700000",
          questionsAnswered: 20,
          correct: 15,
          incorrect: 4,
          skipped: 1,
          score: 75.0,
          timeSpent: 210 // 3.5 minutes
        }
      ],
      lastUpdated: "2024-12-19T14:45:00.000Z"
    },
    
    {
      period: "weekly",
      startDate: "2024-12-16T00:00:00.000Z",
      endDate: "2024-12-22T23:59:59.000Z",
      stats: {
        totalQuizzes: 8,
        totalQuestions: 160,
        correctAnswers: 128,
        incorrectAnswers: 24,
        skippedAnswers: 8,
        averageScore: 80.0,
        bestScore: 90.0,
        worstScore: 65.0,
        streakDays: 4,
        currentStreak: 4,
        longestStreak: 4
      },
      history: [
        {
          date: "2024-12-19T14:45:00.000Z",
          quizId: "quiz_1703012700000",
          questionsAnswered: 20,
          correct: 15,
          incorrect: 4,
          skipped: 1,
          score: 75.0,
          timeSpent: 210
        },
        {
          date: "2024-12-19T10:30:00.000Z",
          quizId: "quiz_1702998600000",
          questionsAnswered: 20,
          correct: 17,
          incorrect: 2,
          skipped: 1,
          score: 85.0,
          timeSpent: 180
        },
        {
          date: "2024-12-18T16:20:00.000Z",
          quizId: "quiz_1702916400000",
          questionsAnswered: 20,
          correct: 18,
          incorrect: 1,
          skipped: 1,
          score: 90.0,
          timeSpent: 195
        },
        {
          date: "2024-12-17T09:15:00.000Z",
          quizId: "quiz_1702816500000",
          questionsAnswered: 20,
          correct: 13,
          incorrect: 6,
          skipped: 1,
          score: 65.0,
          timeSpent: 240
        },
        {
          date: "2024-12-16T14:30:00.000Z",
          quizId: "quiz_1702738200000",
          questionsAnswered: 20,
          correct: 16,
          incorrect: 3,
          skipped: 1,
          score: 80.0,
          timeSpent: 200
        },
        {
          date: "2024-12-16T11:00:00.000Z",
          quizId: "quiz_1702726800000",
          questionsAnswered: 20,
          correct: 15,
          incorrect: 4,
          skipped: 1,
          score: 75.0,
          timeSpent: 220
        },
        {
          date: "2024-12-16T08:45:00.000Z",
          quizId: "quiz_1702717500000",
          questionsAnswered: 20,
          correct: 17,
          incorrect: 2,
          skipped: 1,
          score: 85.0,
          timeSpent: 190
        },
        {
          date: "2024-12-16T06:30:00.000Z",
          quizId: "quiz_1702708200000",
          questionsAnswered: 20,
          correct: 17,
          incorrect: 2,
          skipped: 1,
          score: 85.0,
          timeSpent: 185
        }
      ],
      lastUpdated: "2024-12-19T14:45:00.000Z"
    },
    
    {
      period: "monthly",
      startDate: "2024-12-01T00:00:00.000Z",
      endDate: "2024-12-31T23:59:59.000Z",
      stats: {
        totalQuizzes: 45,
        totalQuestions: 900,
        correctAnswers: 720,
        incorrectAnswers: 135,
        skippedAnswers: 45,
        averageScore: 80.0,
        bestScore: 95.0,
        worstScore: 60.0,
        streakDays: 15,
        currentStreak: 4,
        longestStreak: 15
      },
      history: [
        // ... 45 quiz entries for the month
      ],
      lastUpdated: "2024-12-19T14:45:00.000Z"
    },
    
    {
      period: "yearly",
      startDate: "2024-01-01T00:00:00.000Z",
      endDate: "2024-12-31T23:59:59.000Z",
      stats: {
        totalQuizzes: 365,
        totalQuestions: 7300,
        correctAnswers: 5840,
        incorrectAnswers: 1095,
        skippedAnswers: 365,
        averageScore: 80.0,
        bestScore: 100.0,
        worstScore: 50.0,
        streakDays: 45,
        currentStreak: 4,
        longestStreak: 45
      },
      history: [
        // ... 365 quiz entries for the year
      ],
      lastUpdated: "2024-12-19T14:45:00.000Z"
    },
    
    {
      period: "all-time",
      startDate: "2024-01-15T00:00:00.000Z",
      endDate: "2024-12-19T23:59:59.000Z",
      stats: {
        totalQuizzes: 365,
        totalQuestions: 7300,
        correctAnswers: 5840,
        incorrectAnswers: 1095,
        skippedAnswers: 365,
        averageScore: 80.0,
        bestScore: 100.0,
        worstScore: 50.0,
        streakDays: 45,
        currentStreak: 4,
        longestStreak: 45
      },
      history: [
        // ... all quiz entries since joining
      ],
      lastUpdated: "2024-12-19T14:45:00.000Z"
    }
  ],
  
  stats: {
    totalQuizzesTaken: 365,
    totalQuestionsAnswered: 7300,
    totalCorrectAnswers: 5840,
    totalIncorrectAnswers: 1095,
    totalSkippedAnswers: 365,
    overallAccuracy: 80.0,
    averageQuizScore: 80.0,
    bestQuizScore: 100.0,
    totalTimeSpent: 21900, // 6 hours 5 minutes in seconds
    currentStreak: 4,
    longestStreak: 45,
    lastQuizDate: "2024-12-19T14:45:00.000Z"
  },
  
  createdAt: "2024-01-15T10:30:00.000Z",
  updatedAt: "2024-12-19T14:45:00.000Z"
};

// Example API responses

// GET /api/users/user_123456789/progress
const getAllProgressResponse = {
  overallStats: exampleUser.stats,
  progress: {
    daily: exampleUser.progress[0],
    weekly: exampleUser.progress[1],
    monthly: exampleUser.progress[2],
    yearly: exampleUser.progress[3],
    "all-time": exampleUser.progress[4]
  }
};

// GET /api/users/user_123456789/progress/daily
const getDailyProgressResponse = exampleUser.progress[0];

// POST /api/users/user_123456789/progress
const updateProgressRequest = {
  period: "all",
  quizData: {
    quizId: "quiz_1703012700000",
    totalQuestions: 20,
    correct: 15,
    incorrect: 4,
    skipped: 1,
    timeSpent: 210
  }
};

const updateProgressResponse = {
  message: "Progress updated successfully",
  progress: {
    daily: { /* updated daily progress */ },
    weekly: { /* updated weekly progress */ },
    monthly: { /* updated monthly progress */ },
    yearly: { /* updated yearly progress */ },
    "all-time": { /* updated all-time progress */ }
  },
  overallStats: { /* updated overall stats */ }
};

// GET /api/users/leaderboard/accuracy
const accuracyLeaderboardResponse = [
  {
    name: "Alice Johnson",
    stats: {
      overallAccuracy: 92.5,
      totalQuizzesTaken: 500
    },
    profile: {
      avatar: "https://example.com/alice.jpg"
    }
  },
  {
    name: "Bob Smith",
    stats: {
      overallAccuracy: 88.3,
      totalQuizzesTaken: 300
    },
    profile: {
      avatar: "https://example.com/bob.jpg"
    }
  },
  {
    name: "John Doe",
    stats: {
      overallAccuracy: 80.0,
      totalQuizzesTaken: 365
    },
    profile: {
      avatar: "https://example.com/john.jpg"
    }
  }
];

// GET /api/users/leaderboard/streak
const streakLeaderboardResponse = [
  {
    name: "Carol Wilson",
    stats: {
      currentStreak: 67,
      longestStreak: 67
    },
    profile: {
      avatar: "https://example.com/carol.jpg"
    }
  },
  {
    name: "David Brown",
    stats: {
      currentStreak: 45,
      longestStreak: 45
    },
    profile: {
      avatar: "https://example.com/david.jpg"
    }
  },
  {
    name: "John Doe",
    stats: {
      currentStreak: 4,
      longestStreak: 45
    },
    profile: {
      avatar: "https://example.com/john.jpg"
    }
  }
];

module.exports = {
  exampleUser,
  getAllProgressResponse,
  getDailyProgressResponse,
  updateProgressRequest,
  updateProgressResponse,
  accuracyLeaderboardResponse,
  streakLeaderboardResponse
}; 