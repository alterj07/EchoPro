const mongoose = require('mongoose');

const checklistResultSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  answers: [{
    question: {
      type: String,
      required: true
    },
    selectedAnswer: {
      type: String,
      required: true
    },
    correctAnswer: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    isSkipped: {
      type: Boolean,
      default: false
    }
  }],
  totalQuestions: {
    type: Number,
    required: true
  },
  correctCount: {
    type: Number,
    required: true
  },
  skipCount: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries by user and date
checklistResultSchema.index({ userId: 1, completedAt: -1 });

module.exports = mongoose.model('ChecklistResult', checklistResultSchema); 