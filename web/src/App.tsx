import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserProgressProvider } from './contexts/UserProgressContext';
import { QuizProvider } from './contexts/QuizContext';
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
        width: '100vw',
        fontSize: 'clamp(16px, 2vw, 18px)',
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
      padding: 'clamp(12px, 2vw, 20px)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: 'clamp(10px, 2vw, 20px)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      width: '100%'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '100%',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 clamp(12px, 3vw, 24px)',
        flexWrap: 'wrap',
        gap: 'clamp(8px, 1vw, 12px)'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: 'clamp(12px, 2vw, 20px)', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <Link to="/dashboard" style={{
            fontSize: 'clamp(18px, 3vw, 20px)',
            fontWeight: 'bold',
            color: '#2563EB',
            textDecoration: 'none',
            whiteSpace: 'nowrap'
          }}>
            EchoPro
          </Link>
          <Link to="/dashboard" style={{
            color: '#666',
            textDecoration: 'none',
            padding: 'clamp(6px, 1.5vw, 12px)',
            borderRadius: 6,
            transition: 'background 0.2s',
            fontSize: 'clamp(12px, 1.5vw, 14px)',
            whiteSpace: 'nowrap'
          }} onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}>
            Dashboard
          </Link>
          <Link to="/quiz" style={{
            color: '#666',
            textDecoration: 'none',
            padding: 'clamp(6px, 1.5vw, 12px)',
            borderRadius: 6,
            transition: 'background 0.2s',
            fontSize: 'clamp(12px, 1.5vw, 14px)',
            whiteSpace: 'nowrap'
          }} onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}>
            Quiz
          </Link>
          <Link to="/play" style={{
            color: '#666',
            textDecoration: 'none',
            padding: 'clamp(6px, 1.5vw, 12px)',
            borderRadius: 6,
            transition: 'background 0.2s',
            fontSize: 'clamp(12px, 1.5vw, 14px)',
            whiteSpace: 'nowrap'
          }} onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}>
            Videos
          </Link>
        </div>
        <div style={{ 
          display: 'flex', 
          gap: 'clamp(8px, 1.5vw, 12px)', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <span style={{ 
            color: '#666', 
            fontSize: 'clamp(11px, 1.2vw, 14px)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 'clamp(120px, 15vw, 200px)'
          }}>
            {user.email}
          </span>
          <Link to="/settings" style={{
            color: '#666',
            textDecoration: 'none',
            padding: 'clamp(6px, 1.5vw, 12px)',
            borderRadius: 6,
            transition: 'background 0.2s',
            fontSize: 'clamp(11px, 1.2vw, 14px)',
            whiteSpace: 'nowrap'
          }} onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}>
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            style={{
              padding: 'clamp(6px, 1.5vw, 16px) clamp(8px, 2vw, 16px)',
              background: '#DC2626',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 'clamp(11px, 1.2vw, 14px)',
              whiteSpace: 'nowrap',
              minWidth: 'fit-content'
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
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        background: '#F8FAFC',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Navigation />
        <div style={{
          flex: 1,
          width: '100%',
          overflow: 'auto',
          padding: 'clamp(10px, 2vw, 20px)',
          boxSizing: 'border-box'
        }}>
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
