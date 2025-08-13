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
  progress: [progressSchema],
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});


// Method to ensure all progress periods exist
userSchema.methods.ensureAllProgressPeriods = function(now) {
  // Ensure daily progress exists
  let dailyProgress = this.progress.find(p => p.period === 'daily');
  if (!dailyProgress) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    dailyProgress = {
      period: 'daily',
      startDate: dayStart,
      endDate: dayEnd,
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
      quizQuestions: [],
      currentQuestionIndex: 0,
      history: [],
      lastUpdated: now
    };
    this.progress.push(dailyProgress);
  }

  // Ensure weekly progress exists
  let weeklyProgress = this.progress.find(p => p.period === 'weekly');
  if (!weeklyProgress) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59);
    
    weeklyProgress = {
      period: 'weekly',
      startDate: weekStart,
      endDate: weekEnd,
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
    this.progress.push(weeklyProgress);
  }

  // Ensure monthly progress exists
  let monthlyProgress = this.progress.find(p => p.period === 'monthly');
  if (!monthlyProgress) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    monthlyProgress = {
      period: 'monthly',
      startDate: monthStart,
      endDate: monthEnd,
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
    this.progress.push(monthlyProgress);
  }

  // Ensure yearly progress exists
  let yearlyProgress = this.progress.find(p => p.period === 'yearly');
  if (!yearlyProgress) {
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    
    yearlyProgress = {
      period: 'yearly',
      startDate: yearStart,
      endDate: yearEnd,
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
    this.progress.push(yearlyProgress);
  }

  // Ensure all-time progress exists
  let allTimeProgress = this.progress.find(p => p.period === 'all-time');
  if (!allTimeProgress) {
    allTimeProgress = {
      period: 'all-time',
      startDate: new Date(0),
      endDate: new Date(8640000000000000),
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
    this.progress.push(allTimeProgress);
  }
};

// Method to roll up stats when periods pass
userSchema.methods.rollupStats = async function() {
  const now = new Date();
  
  // Ensure all progress periods exist
  this.ensureAllProgressPeriods(now);
  
  // Check if daily period has passed and roll up to weekly
  const dailyProgress = this.progress.find(p => p.period === 'daily');
  if (dailyProgress && dailyProgress.endDate < now) {
    console.log('Rolling up daily stats to weekly for user:', this.userId);
    
    // Get or create weekly progress
    let weeklyProgress = this.progress.find(p => p.period === 'weekly');
    if (!weeklyProgress) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59);
      
      weeklyProgress = {
        period: 'weekly',
        startDate: weekStart,
        endDate: weekEnd,
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
      this.progress.push(weeklyProgress);
    }
    
    // Add daily stats to weekly
    weeklyProgress.stats.totalQuizzes += dailyProgress.stats.totalQuizzes;
    weeklyProgress.stats.totalQuestions += dailyProgress.stats.totalQuestions;
    weeklyProgress.stats.correctAnswers += dailyProgress.stats.correctAnswers;
    weeklyProgress.stats.incorrectAnswers += dailyProgress.stats.incorrectAnswers;
    weeklyProgress.stats.skippedAnswers += dailyProgress.stats.skippedAnswers;
    
    // Recalculate weekly averages
    if (weeklyProgress.stats.totalQuizzes > 0) {
      weeklyProgress.stats.averageScore = (weeklyProgress.stats.correctAnswers / weeklyProgress.stats.totalQuestions) * 100;
    }
    
    // Add daily history to weekly
    if (!weeklyProgress.history) {
      weeklyProgress.history = [];
    }
    if (dailyProgress.history && dailyProgress.history.length > 0) {
      weeklyProgress.history.push(...dailyProgress.history);
    }
    
    // Reset daily progress for new day
    const newDayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const newDayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    dailyProgress.startDate = newDayStart;
    dailyProgress.endDate = newDayEnd;
    dailyProgress.stats = {
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
    };
    dailyProgress.history = [];
    dailyProgress.quizQuestions = [];
    dailyProgress.currentQuestionIndex = 0;
  }
  
  // Check if weekly period has passed and roll up to monthly
  const weeklyProgress = this.progress.find(p => p.period === 'weekly');
  if (weeklyProgress && weeklyProgress.endDate < now) {
    console.log('Rolling up weekly stats to monthly for user:', this.userId);
    
    // Get or create monthly progress
    let monthlyProgress = this.progress.find(p => p.period === 'monthly');
    if (!monthlyProgress) {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      monthlyProgress = {
        period: 'monthly',
        startDate: monthStart,
        endDate: monthEnd,
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
      this.progress.push(monthlyProgress);
    }
    
    // Add weekly stats to monthly
    monthlyProgress.stats.totalQuizzes += weeklyProgress.stats.totalQuizzes;
    monthlyProgress.stats.totalQuestions += weeklyProgress.stats.totalQuestions;
    monthlyProgress.stats.correctAnswers += weeklyProgress.stats.correctAnswers;
    monthlyProgress.stats.incorrectAnswers += weeklyProgress.stats.incorrectAnswers;
    monthlyProgress.stats.skippedAnswers += weeklyProgress.stats.skippedAnswers;
    
    // Recalculate monthly averages
    if (monthlyProgress.stats.totalQuizzes > 0) {
      monthlyProgress.stats.averageScore = (monthlyProgress.stats.correctAnswers / monthlyProgress.stats.totalQuestions) * 100;
    }
    
    // Add weekly history to monthly
    if (!monthlyProgress.history) {
      monthlyProgress.history = [];
    }
    if (weeklyProgress.history && weeklyProgress.history.length > 0) {
      monthlyProgress.history.push(...weeklyProgress.history);
    }
    
    // Reset weekly progress for new week
    const newWeekStart = new Date(now);
    newWeekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    const newWeekEnd = new Date(newWeekStart);
    newWeekEnd.setDate(newWeekStart.getDate() + 6);
    newWeekEnd.setHours(23, 59, 59);
    
    weeklyProgress.startDate = newWeekStart;
    weeklyProgress.endDate = newWeekEnd;
    weeklyProgress.stats = {
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
    };
    weeklyProgress.history = [];
  }
  
  // Check if monthly period has passed and roll up to yearly
  const monthlyProgress = this.progress.find(p => p.period === 'monthly');
  if (monthlyProgress && monthlyProgress.endDate < now) {
    console.log('Rolling up monthly stats to yearly for user:', this.userId);
    
    // Get or create yearly progress
    let yearlyProgress = this.progress.find(p => p.period === 'yearly');
    if (!yearlyProgress) {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      
      yearlyProgress = {
        period: 'yearly',
        startDate: yearStart,
        endDate: yearEnd,
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
      this.progress.push(yearlyProgress);
    }
    
    // Add monthly stats to yearly
    yearlyProgress.stats.totalQuizzes += monthlyProgress.stats.totalQuizzes;
    yearlyProgress.stats.totalQuestions += monthlyProgress.stats.totalQuestions;
    yearlyProgress.stats.correctAnswers += monthlyProgress.stats.correctAnswers;
    yearlyProgress.stats.incorrectAnswers += monthlyProgress.stats.incorrectAnswers;
    yearlyProgress.stats.skippedAnswers += monthlyProgress.stats.skippedAnswers;
    
    // Recalculate yearly averages
    if (yearlyProgress.stats.totalQuizzes > 0) {
      yearlyProgress.stats.averageScore = (yearlyProgress.stats.correctAnswers / yearlyProgress.stats.totalQuestions) * 100;
    }
    
    // Add monthly history to yearly
    if (!yearlyProgress.history) {
      yearlyProgress.history = [];
    }
    if (monthlyProgress.history && monthlyProgress.history.length > 0) {
      yearlyProgress.history.push(...monthlyProgress.history);
    }
    
    // Reset monthly progress for new month
    const newMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    monthlyProgress.startDate = newMonthStart;
    monthlyProgress.endDate = newMonthEnd;
    monthlyProgress.stats = {
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
    };
    monthlyProgress.history = [];
  }
  
  // Check if yearly period has passed and roll up to all-time
  const yearlyProgress = this.progress.find(p => p.period === 'yearly');
  if (yearlyProgress && yearlyProgress.endDate < now) {
    console.log('Rolling up yearly stats to all-time for user:', this.userId);
    
    // Get or create all-time progress
    let allTimeProgress = this.progress.find(p => p.period === 'all-time');
    if (!allTimeProgress) {
      allTimeProgress = {
        period: 'all-time',
        startDate: new Date(0),
        endDate: new Date(8640000000000000),
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
      this.progress.push(allTimeProgress);
    }
    
    // Add yearly stats to all-time
    allTimeProgress.stats.totalQuizzes += yearlyProgress.stats.totalQuizzes;
    allTimeProgress.stats.totalQuestions += yearlyProgress.stats.totalQuestions;
    allTimeProgress.stats.correctAnswers += yearlyProgress.stats.correctAnswers;
    allTimeProgress.stats.incorrectAnswers += yearlyProgress.stats.incorrectAnswers;
    allTimeProgress.stats.skippedAnswers += yearlyProgress.stats.skippedAnswers;
    
    // Recalculate all-time averages
    if (allTimeProgress.stats.totalQuizzes > 0) {
      allTimeProgress.stats.averageScore = (allTimeProgress.stats.correctAnswers / allTimeProgress.stats.totalQuestions) * 100;
    }
    
    // Add yearly history to all-time
    if (!allTimeProgress.history) {
      allTimeProgress.history = [];
    }
    if (yearlyProgress.history && yearlyProgress.history.length > 0) {
      allTimeProgress.history.push(...yearlyProgress.history);
    }
    
    // Reset yearly progress for new year
    const newYearStart = new Date(now.getFullYear(), 0, 1);
    const newYearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    
    yearlyProgress.startDate = newYearStart;
    yearlyProgress.endDate = newYearEnd;
    yearlyProgress.stats = {
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
    };
    yearlyProgress.history = [];
  }
  
  // Save with retry logic for version conflicts
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    try {
      await this.save();
      break; // Success, exit retry loop
    } catch (error) {
      if (error.name === 'VersionError' && retries < maxRetries - 1) {
        console.log(`Version conflict on rollupStats for user ${this.userId}, retrying... (${retries + 1}/${maxRetries})`);
        retries++;
        // Reload the document to get the latest version
        await this.reload();
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 50));
      } else {
        console.error('Error in rollupStats save:', error);
        throw error;
      }
    }
  }
};

// Method to update progress for a specific period
userSchema.methods.updateProgress = async function(period, quizData) {
  // First, check and roll up stats if periods have passed
  await this.rollupStats();
  
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
  if (!progress.history) {
    progress.history = [];
  }
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

  // Save with retry logic for version conflicts
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    try {
      await this.save();
      break; // Success, exit retry loop
    } catch (error) {
      if (error.name === 'VersionError' && retries < maxRetries - 1) {
        console.log(`Version conflict on updateProgress for user ${this.userId}, retrying... (${retries + 1}/${maxRetries})`);
        retries++;
        // Reload the document to get the latest version
        await this.reload();
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 50));
      } else {
        console.error('Error in updateProgress save:', error);
        throw error;
      }
    }
  }
  
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