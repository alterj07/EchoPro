# EchoPro Web App

A React web application for EchoPro, built with Vite and TypeScript.

## Features

- **Quiz Interface**: Interactive music quiz with multiple choice questions
- **Dashboard**: Comprehensive progress tracking and statistics
- **Authentication**: User login and registration
- **Responsive Design**: Works on desktop and mobile devices
- **Offline Support**: Falls back to localStorage when backend is unavailable

## Current State

The web app is deployed on Vercel and includes:

- ✅ Frontend deployment working
- ✅ Authentication system (localStorage-based for web)
- ✅ Quiz functionality with localStorage fallback
- ✅ Dashboard with progress tracking
- ⚠️ Backend API (needs deployment)

## Backend Deployment

The backend is currently configured to run locally on `localhost:3000`. To enable full functionality, you need to deploy the backend to a cloud service.

### Option 1: Deploy to Railway

1. **Create Railway account**: Visit [railway.app](https://railway.app)
2. **Connect your repository**: Link your GitHub repository
3. **Deploy backend**: Set the root directory to `backend/`
4. **Configure environment variables**:
   - `MONGODB_URI`: Your MongoDB connection string
   - `PORT`: Railway will set this automatically
5. **Update frontend**: Set `VITE_API_URL` to your Railway deployment URL

### Option 2: Deploy to Render

1. **Create Render account**: Visit [render.com](https://render.com)
2. **Create new Web Service**: Connect your GitHub repository
3. **Configure service**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. **Add environment variables**:
   - `MONGODB_URI`: Your MongoDB connection string
5. **Update frontend**: Set `VITE_API_URL` to your Render deployment URL

### Option 3: Deploy to Heroku

1. **Create Heroku account**: Visit [heroku.com](https://heroku.com)
2. **Install Heroku CLI**: Follow [Heroku CLI installation guide](https://devcenter.heroku.com/articles/heroku-cli)
3. **Deploy backend**:
   ```bash
   cd backend
   heroku create your-app-name
   heroku config:set MONGODB_URI=your_mongodb_connection_string
   git add .
   git commit -m "Deploy backend"
   git push heroku main
   ```
4. **Update frontend**: Set `VITE_API_URL` to your Heroku deployment URL

## Environment Variables

Create a `.env` file in the `web` directory:

```env
VITE_API_URL=https://your-backend-url.com/api
```

## Development

1. **Install dependencies**:
   ```bash
   cd web
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## Offline Mode

The app gracefully handles backend connectivity issues:

- **API Failures**: Automatically falls back to localStorage
- **Data Persistence**: All quiz results and progress stored locally
- **Seamless Experience**: Users can continue using the app without interruption

## API Integration

The app uses a dual approach for data storage:

1. **Primary**: Backend API (when available)
2. **Fallback**: localStorage (when backend is unavailable)

This ensures the app works in all scenarios:
- ✅ Backend deployed and accessible
- ✅ Backend temporarily unavailable
- ✅ No backend deployment

## Deployment

The app is automatically deployed to Vercel on push to main branch.

### Manual Deployment

1. **Build the app**:
   ```bash
   cd web
   npm run build
   ```

2. **Deploy to Vercel**:
   ```bash
   npx vercel --prod
   ```

## Troubleshooting

### Backend Connection Issues

If you see connection refused errors in the console:

1. **Check backend deployment**: Ensure your backend is running and accessible
2. **Verify environment variables**: Check `VITE_API_URL` is set correctly
3. **Test backend health**: Visit `your-backend-url.com/health`

### localStorage Issues

If the app isn't saving data:

1. **Check browser support**: Ensure localStorage is enabled
2. **Clear browser data**: Try clearing localStorage and refreshing
3. **Check console errors**: Look for localStorage-related errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
