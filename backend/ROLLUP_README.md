# Stats Rollup System

## Overview
The stats rollup system automatically moves user statistics from shorter time periods to longer time periods when those periods expire.

## How It Works

### Time Periods
- **Daily**: Current day (00:00 to 23:59)
- **Weekly**: Current week (Monday to Sunday)
- **Monthly**: Current month (1st to last day)
- **Yearly**: Current year (January 1st to December 31st)
- **All-time**: Lifetime stats

### Rollup Process
1. **Daily → Weekly**: When a day ends, daily stats are added to weekly stats
2. **Weekly → Monthly**: When a week ends, weekly stats are added to monthly stats  
3. **Monthly → Yearly**: When a month ends, monthly stats are added to yearly stats
4. **Yearly → All-time**: When a year ends, yearly stats are added to all-time stats

### When Rollup Occurs
- **On Login**: When a user logs in, `rollupStats()` is called
- **On Progress Access**: When getting user progress data
- **On Progress Update**: When updating user progress
- **Scheduled**: Can be run manually or via cron job

## Usage

### Manual Testing
```bash
# Test rollup functionality
npm run test-rollup

# Run scheduled rollup for all users
npm run rollup
```

### API Integration
The rollup is automatically called in these API endpoints:
- `POST /users/login`
- `GET /users/:userId`
- `POST /users/:userId/progress`
- `GET /users/:userId/progress/:period`
- `GET /users/:userId/progress`

## Data Structure
Each period stores:
- `totalQuizzes`: Number of quizzes taken
- `totalQuestions`: Total questions answered
- `correctAnswers`: Correct answers
- `incorrectAnswers`: Incorrect answers
- `skippedAnswers`: Skipped answers
- `averageScore`: Average score percentage
- `bestScore`: Best score achieved
- `worstScore`: Worst score achieved
- `history`: Array of quiz results

## Example
If a user takes 3 quizzes on Monday with 10 correct, 5 incorrect, 2 skipped:
- **Daily**: 3 quizzes, 17 questions, 10 correct, 5 incorrect, 2 skipped
- **Weekly**: 3 quizzes, 17 questions, 10 correct, 5 incorrect, 2 skipped

When Tuesday starts:
- **Daily**: Reset to 0 (new day)
- **Weekly**: Still has 3 quizzes, 17 questions, 10 correct, 5 incorrect, 2 skipped

When the week ends:
- **Weekly**: Stats roll up to monthly
- **Monthly**: Gets the weekly stats
- **Weekly**: Reset to 0 (new week) 