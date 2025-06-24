# EchoPro Backend

A Node.js backend for the EchoPro React Native app that handles dashboard data and checklist results.

## Features

- **Checklist Results Management**: Store and retrieve checklist completion data
- **Dashboard Analytics**: Generate dashboard data for different time periods (day, week, month, year)
- **User Management**: Handle user profiles and preferences
- **Real-time Data**: Calculate percentages and statistics from checklist results

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up MongoDB:**
   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGODB_URI` in your environment variables

3. **Environment variables:**
   Create a `.env` file based on `config.env`:
   ```bash
   cp config.env .env
   ```

4. **Start the server:**
   ```bash
   npm run dev  # Development with nodemon
   npm start    # Production
   ```

## API Endpoints

### Checklist Routes

#### POST `/api/checklist/submit`
Submit checklist results.

**Request Body:**
```json
{
  "userId": "user123",
  "answers": [
    {
      "question": "What is the capital of France?",
      "selectedAnswer": "Paris",
      "correctAnswer": "Paris",
      "isCorrect": true,
      "isSkipped": false
    }
  ],
  "totalQuestions": 10,
  "correctCount": 8,
  "skipCount": 1,
  "percentage": 80
}
```

#### GET `/api/checklist/dashboard/:userId/:period`
Get dashboard data for a specific period (day, week, month, year).

**Response:**
```json
{
  "period": "day",
  "percent": 75,
  "history": [
    {
      "date": "Monday, June 12, 2025",
      "correct": "8/10",
      "skip": 1,
      "percent": 80,
      "color": "#ffe066"
    }
  ]
}
```

#### GET `/api/checklist/recent/:userId?limit=10`
Get recent checklist results for a user.

### User Routes

#### POST `/api/users/create`
Create or get a user.

**Request Body:**
```json
{
  "userId": "user123",
  "name": "Tim"
}
```

#### GET `/api/users/:userId`
Get user by ID.

#### PUT `/api/users/:userId/preferences`
Update user preferences.

**Request Body:**
```json
{
  "fontSize": "big"
}
```

## Database Schema

### ChecklistResult
- `userId`: User identifier
- `answers`: Array of question answers with correctness
- `totalQuestions`: Total number of questions
- `correctCount`: Number of correct answers
- `skipCount`: Number of skipped questions
- `percentage`: Overall percentage score
- `completedAt`: Timestamp of completion

### User
- `userId`: Unique user identifier
- `name`: User's display name
- `preferences`: User preferences (fontSize, etc.)

## Integration with React Native

To integrate with your React Native app:

1. **Install axios:**
   ```bash
   npm install axios
   ```

2. **Create API service:**
   ```javascript
   import axios from 'axios';

   const API_BASE_URL = 'http://localhost:3000/api';

   export const submitChecklist = async (data) => {
     const response = await axios.post(`${API_BASE_URL}/checklist/submit`, data);
     return response.data;
   };

   export const getDashboardData = async (userId, period) => {
     const response = await axios.get(`${API_BASE_URL}/checklist/dashboard/${userId}/${period}`);
     return response.data;
   };
   ```

3. **Update your screens to use real data instead of dummy data.**

## Health Check

Visit `http://localhost:3000/health` to check if the server is running.

## Security Features

- CORS enabled for cross-origin requests
- Helmet.js for security headers
- Rate limiting to prevent abuse
- Input validation and sanitization
- Error handling middleware 