const mongoose = require('mongoose');

// Progress tracking schema for different time periods
const progressSchema = new mongoose.Schema({
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'all-time'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  stats: {
    totalQuizzes: {
      type: Number,
      default: 0
    },
    totalQuestions: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    incorrectAnswers: {
      type: Number,
      default: 0
    },
    skippedAnswers: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    bestScore: {
      type: Number,
      default: 0
    },
    worstScore: {
      type: Number,
      default: 0
    },
    streakDays: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    }
  },
  // Active quiz state for resuming quizzes
  quizQuestions: {
    type: [{
      id: String,
      track: {
        trackId: Number,
        trackName: String,
        artistName: String,
        previewUrl: String
      },
      options: [String],
      correctAnswer: String,
      userAnswer: String,
      status: {
        type: String,
        enum: ['unanswered', 'correct', 'incorrect', 'skipped'],
        default: 'unanswered'
      }
    }],
    default: []
  },
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  history: [{
    date: {
      type: Date,
      required: true
    },
    quizId: {
      type: String,
      required: true
    },
    questionsAnswered: {
      type: Number,
      default: 0
    },
    correct: {
      type: Number,
      default: 0
    },
    incorrect: {
      type: Number,
      default: 0
    },
    skipped: {
      type: Number,
      default: 0
    },
    score: {
      type: Number,
      default: 0
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
progressSchema.index({ userId: 1, period: 1, startDate: -1 });

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true // Allows multiple null values but enforces uniqueness for non-null values
  },
  password: {
    type: String,
    required: false // Optional for users created via Google/Apple sign-in
  },
  preferences: {
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'big'],
      default: 'medium'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    dailyReminder: {
      type: Boolean,
      default: true
    },
    reminderTime: {
      type: String,
      default: '09:00'
    }
  },
  profile: {
    avatar: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      maxlength: 500,
      default: ''
    },
    birthday: {
      type: String,
      default: null
    },
    joinDate: {
      type: Date,
      default: Date.now
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  achievements: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0
    },
    maxProgress: {
      type: Number,
      default: 1
    }
  }],
  progress: [progressSchema],
  stats: {
    // Overall lifetime stats
    totalQuizzesTaken: {
      type: Number,
      default: 0
    },
    totalQuestionsAnswered: {
      type: Number,
      default: 0
    },
    totalCorrectAnswers: {
      type: Number,
      default: 0
    },
    totalIncorrectAnswers: {
      type: Number,
      default: 0
    },
    totalSkippedAnswers: {
      type: Number,
      default: 0
    },
    overallAccuracy: {
      type: Number,
      default: 0
    },
    averageQuizScore: {
      type: Number,
      default: 0
    },
    bestQuizScore: {
      type: Number,
      default: 0
    },
    totalTimeSpent: {
      type: Number, // in seconds
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastQuizDate: {
      type: Date,
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
userSchema.index({ 'stats.lastQuizDate': -1 });
userSchema.index({ 'stats.overallAccuracy': -1 });
userSchema.index({ 'stats.currentStreak': -1 });

// Method to update progress for a specific period
userSchema.methods.updateProgress = async function(period, quizData) {
  const now = new Date();
  let startDate, endDate;
  
  // Calculate period boundaries
  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case 'weekly':
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startDate = new Date(now.getFullYear(), now.getMonth(), diff);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    case 'all-time':
      startDate = new Date(0); // Beginning of time
      endDate = new Date(8640000000000000); // End of time
      break;
  }

  // Find existing progress for this period or create new one
  let progress = this.progress.find(p => p.period === period);
  
  if (!progress) {
    progress = {
      period,
      startDate,
      endDate,
      stats: {
        totalQuizzes: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        skippedAnswers: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        streakDays: 0,
        currentStreak: 0,
        longestStreak: 0
      },
      history: []
    };
    this.progress.push(progress);
  }

  // Update progress stats
  progress.stats.totalQuizzes += 1;
  progress.stats.totalQuestions += quizData.totalQuestions;
  progress.stats.correctAnswers += quizData.correct;
  progress.stats.incorrectAnswers += quizData.incorrect;
  progress.stats.skippedAnswers += quizData.skipped;
  
  const score = quizData.totalQuestions > 0 ? (quizData.correct / quizData.totalQuestions) * 100 : 0;
  progress.stats.averageScore = progress.stats.totalQuizzes > 0 ? 
    ((progress.stats.averageScore * (progress.stats.totalQuizzes - 1)) + score) / progress.stats.totalQuizzes : score;
  
  if (score > progress.stats.bestScore) {
    progress.stats.bestScore = score;
  }
  if (score < progress.stats.worstScore || progress.stats.worstScore === 0) {
    progress.stats.worstScore = score;
  }

  // Add to history
  progress.history.push({
    date: now,
    quizId: quizData.quizId || `quiz_${Date.now()}`,
    questionsAnswered: quizData.totalQuestions,
    correct: quizData.correct,
    incorrect: quizData.incorrect,
    skipped: quizData.skipped,
    score: score,
    timeSpent: quizData.timeSpent || 0
  });

  progress.lastUpdated = now;

  // Update overall stats
  this.stats.totalQuizzesTaken += 1;
  this.stats.totalQuestionsAnswered += quizData.totalQuestions;
  this.stats.totalCorrectAnswers += quizData.correct;
  this.stats.totalIncorrectAnswers += quizData.incorrect;
  this.stats.totalSkippedAnswers += quizData.skipped;
  this.stats.overallAccuracy = this.stats.totalQuestionsAnswered > 0 ? 
    (this.stats.totalCorrectAnswers / this.stats.totalQuestionsAnswered) * 100 : 0;
  this.stats.averageQuizScore = this.stats.totalQuizzesTaken > 0 ? 
    ((this.stats.averageQuizScore * (this.stats.totalQuizzesTaken - 1)) + score) / this.stats.totalQuizzesTaken : score;
  
  if (score > this.stats.bestQuizScore) {
    this.stats.bestQuizScore = score;
  }
  
  if (quizData.timeSpent) {
    this.stats.totalTimeSpent += quizData.timeSpent;
  }
  
  this.stats.lastQuizDate = now;
  this.profile.lastActive = now;

  await this.save();
  return progress;
};

// Method to get progress for a specific period
userSchema.methods.getProgress = function(period) {
  return this.progress.find(p => p.period === period) || null;
};

// Method to get all progress data
userSchema.methods.getAllProgress = function() {
  return this.progress.reduce((acc, p) => {
    acc[p.period] = p;
    return acc;
  }, {});
};

module.exports = mongoose.model('User', userSchema); 