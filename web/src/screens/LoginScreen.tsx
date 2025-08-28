import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, googleSignIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please fill in both email and password fields');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await googleSignIn();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100vw',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#F8FAFC',
      padding: 'clamp(16px, 3vw, 24px)',
      boxSizing: 'border-box'
    }}>
      <form onSubmit={handleEmailLogin} style={{ 
        background: '#fff', 
        padding: 'clamp(20px, 4vw, 32px)', 
        borderRadius: 16, 
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
        width: 'clamp(280px, 90vw, 350px)',
        maxWidth: '100%'
      }}>
        <h1 style={{ 
          fontSize: 'clamp(20px, 4vw, 28px)', 
          fontWeight: 700, 
          marginBottom: 8, 
          textAlign: 'center' 
        }}>
          Welcome to EchoPro
        </h1>
        <p style={{ 
          fontSize: 'clamp(14px, 2vw, 18px)', 
          color: '#666', 
          marginBottom: 'clamp(16px, 3vw, 24px)', 
          textAlign: 'center' 
        }}>
          Your Music Memory App
        </p>
        {error && (
          <div style={{ 
            color: '#DC2626', 
            marginBottom: 'clamp(12px, 2vw, 16px)', 
            textAlign: 'center',
            fontSize: 'clamp(12px, 1.5vw, 14px)'
          }}>
            {error}
          </div>
        )}
        <div style={{ marginBottom: 'clamp(12px, 2vw, 16px)' }}>
          <label style={{ 
            display: 'block', 
            fontWeight: 600, 
            marginBottom: 4, 
            color: '#374151',
            fontSize: 'clamp(12px, 1.5vw, 14px)'
          }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ 
              width: '100%', 
              padding: 'clamp(10px, 1.5vw, 12px)', 
              borderRadius: 8, 
              border: '1px solid #D1D5DB', 
              fontSize: 'clamp(14px, 1.5vw, 16px)',
              color: '#1F2937',
              backgroundColor: '#FFFFFF',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#2563EB';
              e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#D1D5DB';
              e.target.style.boxShadow = 'none';
            }}
            autoComplete="email"
            required
          />
        </div>
        <div style={{ marginBottom: 'clamp(16px, 3vw, 24px)' }}>
          <label style={{ 
            display: 'block', 
            fontWeight: 600, 
            marginBottom: 4, 
            color: '#374151',
            fontSize: 'clamp(12px, 1.5vw, 14px)'
          }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ 
              width: '100%', 
              padding: 'clamp(10px, 1.5vw, 12px)', 
              borderRadius: 8, 
              border: '1px solid #D1D5DB', 
              fontSize: 'clamp(14px, 1.5vw, 16px)',
              color: '#1F2937',
              backgroundColor: '#FFFFFF',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#2563EB';
              e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#D1D5DB';
              e.target.style.boxShadow = 'none';
            }}
            autoComplete="current-password"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 'clamp(12px, 2vw, 14px)',
            borderRadius: 8,
            background: '#2563EB',
            color: '#fff',
            fontWeight: 700,
            fontSize: 'clamp(14px, 2vw, 18px)',
            border: 'none',
            marginBottom: 'clamp(12px, 2vw, 16px)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.2s',
            boxSizing: 'border-box'
          }}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: 'clamp(12px, 2vw, 14px)',
            borderRadius: 8,
            background: '#fff',
            color: '#2563EB',
            fontWeight: 700,
            fontSize: 'clamp(14px, 2vw, 18px)',
            border: '2px solid #2563EB',
            marginBottom: 'clamp(8px, 1.5vw, 12px)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.2s',
            boxSizing: 'border-box'
          }}
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
        <div style={{ 
          textAlign: 'center', 
          marginTop: 'clamp(16px, 3vw, 24px)',
          fontSize: 'clamp(12px, 1.5vw, 14px)'
        }}>
          <span style={{ color: '#666' }}>Don't have an account? </span>
          <Link to="/signup" style={{ 
            color: '#2563EB', 
            textDecoration: 'none', 
            fontWeight: 600 
          }}>
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
};

export default LoginScreen; 