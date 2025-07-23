# EchoPro - Personalized Music Quiz App

A React Native app that tests your knowledge of music from your formative years (ages 15-40) through an interactive quiz experience.

## Features

### 🎵 Personalized Music Quiz
- **Age-Based Music Selection**: Quiz features top songs from when you were 15-40 years old
- **Daily Quiz Limit**: Users can answer up to 20 questions per day
- **Random Song Playback**: Each question plays a random song for 10-30 seconds
- **Multiple Choice**: 4 song title options plus an "I don't know" option
- **Interactive Feedback**: Visual feedback for correct/incorrect answers
- **Progress Tracking**: Real-time progress updates during the quiz

### 📊 Performance Dashboard
- **Live Performance**: Shows current day's quiz performance
- **Historical Data**: View performance over different time periods (day, week, month, year, all-time)
- **Statistics**: Track correct, incorrect, and skipped answers
- **Percentage Calculations**: Automatic calculation of success rates

### 🎯 Quiz Features
- **Personalized Song Selection**: Uses iTunes API to fetch songs from your formative years (ages 15-40)
- **Fallback Options**: If birthday not provided, uses a mix of popular decades
- **Randomized Questions**: Each quiz session generates unique questions
- **Answer Validation**: Immediate feedback on answer selection
- **Daily Reset**: Quiz limits reset at midnight for fresh daily challenges

## Technical Implementation

### Quiz Flow
1. **Start Screen**: Shows daily progress and quiz statistics
2. **Quiz Screen**: 
   - Displays current question number and daily progress
   - Plays random 80s song for 10-30 seconds
   - Shows 4 multiple choice options + "I don't know"
   - Provides visual feedback for answers
3. **Results Screen**: Shows final statistics for the quiz session

### Data Storage
- **AsyncStorage**: Stores daily quiz data and historical performance
- **Quiz History**: Maintains detailed records of all quiz attempts
- **Daily Limits**: Tracks and enforces 20 questions per day limit

### State Management
- **QuizContext**: Manages global quiz state across the app
- **Real-time Updates**: Dashboard updates live during quiz sessions
- **Persistent Data**: All quiz data persists between app sessions

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. For iOS:
   ```bash
   cd ios && pod install && cd ..
   npx react-native run-ios
   ```

3. For Android:
   ```bash
   npx react-native run-android
   ```

## Authentication

The app supports multiple authentication methods:

### Apple Sign-In
- **iOS Only**: Available on iOS devices with iOS 13+
- **Automatic Setup**: Configured with Firebase authentication
- **User Data**: Retrieves email and full name (if provided by user)
- **Privacy**: Follows Apple's privacy guidelines

### Google Sign-In
- **Cross-Platform**: Available on both iOS and Android
- **Firebase Integration**: Seamlessly integrated with Firebase Auth
- **User Profile**: Automatically creates user profile in backend

### Email/Password
- **Traditional**: Standard email and password authentication
- **Backend Integration**: Creates user records in the backend API
- **Development**: Includes dev account for testing purposes

## Dependencies

- **react-native-track-player**: Audio playback for song previews
- **@react-native-async-storage/async-storage**: Local data persistence
- **react-native-vector-icons**: UI icons
- **@react-navigation**: Navigation between screens
- **@invertase/react-native-apple-authentication**: Apple Sign-In integration
- **@react-native-google-signin/google-signin**: Google Sign-In integration
- **@react-native-firebase/auth**: Firebase authentication

## API Integration

The app uses the iTunes Search API to fetch personalized songs:
- **Personalized Endpoint**: Searches for songs from years when user was 15-40 years old
- **Fallback Endpoint**: Uses decade-based searches (70s, 80s, 90s, 2000s, 2010s) if birthday not provided
- Filters songs with available preview URLs
- Generates random questions from the song pool

## Web App Deployment

The web version is deployed on Vercel at [echo-pro.vercel.app](https://echo-pro.vercel.app).

### Current Status
- ✅ **Frontend**: Deployed and working
- ✅ **Authentication**: localStorage-based for web
- ✅ **Quiz Functionality**: Full quiz experience with localStorage fallback
- ✅ **Dashboard**: Progress tracking and statistics
- ⚠️ **Backend API**: Needs deployment (currently falls back to localStorage)

### Backend Deployment
The backend needs to be deployed to enable full functionality. See [web/README.md](web/README.md) for detailed deployment instructions.

**Quick Deployment Options:**
- **Railway**: Easy deployment with MongoDB integration
- **Render**: Free tier available with automatic deployments
- **Heroku**: Traditional deployment option

## Quiz Algorithm

1. **Personalized Song Selection**: 
   - Calculates years when user was 15-40 years old
   - Fetches top songs from those specific years
   - Falls back to decade mix if birthday not provided
2. **Question Generation**: Creates multiple choice questions with 3 wrong answers + 1 correct answer
3. **Answer Validation**: Compares user selection with correct song title
4. **Progress Tracking**: Updates daily statistics and historical data
5. **Daily Limits**: Enforces 20 questions per day maximum

## Performance Tracking

The app provides comprehensive progress tracking across multiple time periods:

### Time Periods
- **Daily**: Today's quiz performance and statistics
- **Weekly**: This week's performance with daily breakdown
- **Monthly**: This month's performance with weekly trends
- **Yearly**: This year's performance with monthly overview
- **All-Time**: Complete performance history since joining

### Statistics Tracked
- **Quiz Performance**: Total quizzes taken, questions answered
- **Accuracy Metrics**: Correct, incorrect, and skipped answers
- **Score Analysis**: Average, best, and worst scores
- **Streak Tracking**: Current and longest consecutive day streaks
- **Time Tracking**: Total time spent on quizzes
- **Progress History**: Detailed history of all quiz attempts

### Dashboard Features
- **Live Progress**: Real-time updates during active quiz sessions
- **Period Selection**: Switch between different time periods
- **Visual Charts**: Circular progress indicators and progress bars
- **Performance Summary**: Key statistics for each period
- **Historical Data**: Detailed breakdown of past performance

## Backend API

The app includes a comprehensive backend API for user management and progress tracking:

### User Management
- **User Creation**: Automatic user creation on first sign-in
- **Profile Management**: Update user preferences and profile information
- **Authentication Integration**: Works with Firebase Auth, Google Sign-In, and Apple Sign-In

### Progress Tracking API
- **Progress Updates**: Automatically update progress for all time periods
- **Data Retrieval**: Get progress data for specific periods or all periods
- **Statistics Calculation**: Real-time calculation of accuracy, streaks, and performance metrics
- **Leaderboards**: Global leaderboards for accuracy and streaks

### API Endpoints
- `POST /api/users/create` - Create or get user
- `GET /api/users/:userId` - Get user profile
- `POST /api/users/:userId/progress` - Update user progress
- `GET /api/users/:userId/progress/:period` - Get progress for specific period
- `GET /api/users/:userId/progress` - Get all progress data
- `GET /api/users/leaderboard/accuracy` - Get accuracy leaderboard
- `GET /api/users/leaderboard/streak` - Get streak leaderboard

## Future Enhancements

- [x] Comprehensive progress tracking (daily, weekly, monthly, yearly, all-time)
- [x] Achievement system with unlockable badges
- [x] Leaderboards for accuracy and streaks
- [x] Personalized music selection based on user age
- [ ] Difficulty levels (easy, medium, hard)
- [ ] Social features (challenges, friend competitions)
- [ ] Offline mode with cached songs
- [ ] Custom quiz creation
- [ ] Push notifications for daily reminders
- [ ] Advanced analytics and insights
