import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SignupScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthday, setBirthday] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, googleSignIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/\d/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
    return { isValid: true, message: '' };
  };

  const validateBirthday = (birthday: string): { isValid: boolean; message: string } => {
    if (!birthday.trim()) {
      return { isValid: false, message: 'Please enter your birthday' };
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthday)) {
      return { isValid: false, message: 'Please enter birthday in YYYY-MM-DD format' };
    }
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 13) {
      return { isValid: false, message: 'You must be at least 13 years old to use this app' };
    }
    if (age > 100) {
      return { isValid: false, message: 'Please enter a valid birthday' };
    }
    return { isValid: true, message: '' };
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !password || !confirmPassword || !birthday.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const birthdayValidation = validateBirthday(birthday);
    if (!birthdayValidation.isValid) {
      setError(birthdayValidation.message);
      return;
    }
    setLoading(true);
    try {
      await signUp(name, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.message.includes('email address already exists')) {
        setError('An account with this email address already exists. Please sign in instead.');
      } else {
        setError(err.message || 'Signup failed');
      }
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
      <form onSubmit={handleEmailSignup} style={{ 
        background: '#fff', 
        padding: 'clamp(20px, 4vw, 32px)', 
        borderRadius: 16, 
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
        width: 'clamp(300px, 95vw, 400px)',
        maxWidth: '100%'
      }}>
        <h1 style={{ 
          fontSize: 'clamp(20px, 4vw, 28px)', 
          fontWeight: 700, 
          marginBottom: 8, 
          textAlign: 'center' 
        }}>
          Join EchoPro
        </h1>
        <p style={{ 
          fontSize: 'clamp(14px, 2vw, 18px)', 
          color: '#666', 
          marginBottom: 'clamp(16px, 3vw, 24px)', 
          textAlign: 'center' 
        }}>
          Create your account to start your music journey
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
            Full Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
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
            autoComplete="name"
            required
          />
        </div>
        
        <div style={{ marginBottom: 'clamp(12px, 2vw, 16px)' }}>
          <label style={{ 
            display: 'block', 
            fontWeight: 600, 
            marginBottom: 4, 
            color: '#374151',
            fontSize: 'clamp(12px, 1.5vw, 14px)'
          }}>
            Email *
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
        
        <div style={{ marginBottom: 'clamp(12px, 2vw, 16px)' }}>
          <label style={{ 
            display: 'block', 
            fontWeight: 600, 
            marginBottom: 4, 
            color: '#374151',
            fontSize: 'clamp(12px, 1.5vw, 14px)'
          }}>
            Password *
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
            autoComplete="new-password"
            required
          />
        </div>
        
        <div style={{ marginBottom: 'clamp(12px, 2vw, 16px)' }}>
          <label style={{ 
            display: 'block', 
            fontWeight: 600, 
            marginBottom: 4, 
            color: '#374151',
            fontSize: 'clamp(12px, 1.5vw, 14px)'
          }}>
            Confirm Password *
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
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
            autoComplete="new-password"
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
            Birthday *
          </label>
          <input
            type="date"
            value={birthday}
            onChange={e => setBirthday(e.target.value)}
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
          {loading ? 'Creating Account...' : 'Create Account'}
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
          {loading ? 'Signing up...' : 'Sign up with Google'}
        </button>
        <div style={{ 
          textAlign: 'center', 
          marginTop: 'clamp(16px, 3vw, 24px)',
          fontSize: 'clamp(12px, 1.5vw, 14px)'
        }}>
          <span style={{ color: '#666' }}>Already have an account? </span>
          <Link to="/login" style={{ 
            color: '#2563EB', 
            textDecoration: 'none', 
            fontWeight: 600 
          }}>
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
};

export default SignupScreen; 