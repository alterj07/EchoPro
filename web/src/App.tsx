import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserProgressProvider } from './contexts/UserProgressContext';
import { QuizProvider, useQuiz } from './contexts/QuizContext';
import { FontSizeProvider } from './contexts/fontSizeContext';

// Import screens
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import DashboardScreen from './screens/DashboardScreen';
import ChecklistScreen from './screens/ChecklistScreen';
import SettingsScreen from './screens/SettingsScreen';
import PlayScreen from './screens/PlayScreen';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: 18,
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Navigation Component
const Navigation: React.FC = () => {
  const { user, signOut, saveTodayProgressToBackend } = useAuth();

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      // Save today's progress to backend before signing out
      if (user?.uid) {
        await saveTodayProgressToBackend(user.uid);
      }
      await signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
      // Still sign out even if saving progress fails
      await signOut();
    }
  };

  return (
    <nav style={{
      background: '#fff',
      padding: '16px 20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: 20
    }}>
      <div style={{
        width: '100%',
        maxWidth: '100%',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 24px'
      }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link to="/dashboard" style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#2563EB',
            textDecoration: 'none'
          }}>
            EchoPro
          </Link>
          <Link to="/dashboard" style={{
            color: '#666',
            textDecoration: 'none',
            padding: '8px 12px',
            borderRadius: 6,
            transition: 'background 0.2s'
          }} onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}>
            Dashboard
          </Link>
          <Link to="/quiz" style={{
            color: '#666',
            textDecoration: 'none',
            padding: '8px 12px',
            borderRadius: 6,
            transition: 'background 0.2s'
          }} onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}>
            Quiz
          </Link>
          <Link to="/play" style={{
            color: '#666',
            textDecoration: 'none',
            padding: '8px 12px',
            borderRadius: 6,
            transition: 'background 0.2s'
          }} onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}>
            Videos
          </Link>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: '#666', fontSize: 14 }}>
            {user.email}
          </span>
          <Link to="/settings" style={{
            color: '#666',
            textDecoration: 'none',
            padding: '8px 12px',
            borderRadius: 6,
            transition: 'background 0.2s'
          }} onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}>
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            style={{
              padding: '8px 16px',
              background: '#DC2626',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
};

// Main App Component
const AppContent: React.FC = () => {
  return (
    <Router>
      <div style={{ width: '100%', height: '100vh', background: '#F8FAFC' }}>
        <Navigation />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignupScreen />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardScreen />
            </ProtectedRoute>
          } />
          <Route path="/quiz" element={
            <ProtectedRoute>
              <ChecklistScreen />
            </ProtectedRoute>
          } />
          <Route path="/play" element={
            <ProtectedRoute>
              <PlayScreen />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsScreen />
            </ProtectedRoute>
          } />
          
          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

// Root App with all providers
const App: React.FC = () => {
  return (
    <AuthProvider>
      <UserProgressProvider>
        <QuizProvider>
          <FontSizeProvider>
            <AppContent />
          </FontSizeProvider>
        </QuizProvider>
      </UserProgressProvider>
    </AuthProvider>
  );
};

export default App;
