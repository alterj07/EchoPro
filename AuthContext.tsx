import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Alert, Platform } from 'react-native';
import axios from 'axios';

import firebase from '@react-native-firebase/app';

console.log('✅ Firebase app name:', firebase.apps[0]?.name);
console.log('✅ Firebase apps count:', firebase.apps.length);
console.log('✅ Firebase default app:', firebase.app()?.name);

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<FirebaseAuthTypes.User>;
  signOut: () => Promise<void>;
  googleSignIn: () => Promise<void>;
  appleSignIn: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Dynamic API URL based on platform
const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3000/api'  // Android emulator
  : 'http://localhost:3000/api'; // iOS simulator

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await auth().signInWithEmailAndPassword(email, password);
      console.log('User logged in:', response.user.uid);
      // Create user in backend (if not exists)
      await axios.post(`${API_BASE_URL}/users/create`, {
        userId: response.user.uid,
        name: response.user.displayName || response.user.email || 'Unknown',
      });
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Special handling for dev account creation
      if (email === 'dev@echopro.com' && error.code === 'auth/user-not-found') {
        try {
          console.log('Creating dev account...');
          const devResponse = await auth().createUserWithEmailAndPassword(email, password);
          await devResponse.user.updateProfile({
            displayName: 'Development User',
          });
          console.log('Dev account created successfully');
          
          // Create user in backend
          await axios.post(`${API_BASE_URL}/users/create`, {
            userId: devResponse.user.uid,
            name: 'Development User',
          });
          
          Alert.alert('Dev Account Created', 'Development account created successfully! You can now use it for testing.');
          return;
        } catch (createError: any) {
          console.error('Dev account creation failed:', createError);
          Alert.alert('Dev Account Creation Failed', createError.message);
          throw createError;
        }
      }
      
      Alert.alert('Login Failed', error.message);
      throw error;
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    try {
      const response = await auth().createUserWithEmailAndPassword(email, password);
      
      // Update user profile with name
      await response.user.updateProfile({
        displayName: name,
      });

      console.log('User created:', response.user.uid);
      // Create user in backend
      await axios.post(`${API_BASE_URL}/users/create`, {
        userId: response.user.uid,
        name: name,
      });
      
      return response.user;
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert('Signup Failed', error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await auth().signOut();
      await GoogleSignin.signOut();
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Failed', 'Failed to logout. Please try again.');
      throw error;
    }
  };

  const googleSignIn = async () => {
    try {
      console.log('Starting Google Sign-In process...');
      
      // Ensure Firebase is initialized
      if (!firebase.apps.length) {
        console.error('Firebase not initialized!');
        throw new Error('Firebase not initialized. Please restart the app.');
      }
      
      console.log('Firebase is initialized, proceeding with Google Sign-In...');
      
      // Check if user is already signed in
      try {
        const currentUser = await GoogleSignin.getCurrentUser();
        if (currentUser) {
          await GoogleSignin.signOut();
          console.log('Signed out from previous Google Sign-In session');
        }
      } catch (error) {
        console.log('No previous sign-in session found');
      }
      
      // Get the users ID token
      console.log('Calling GoogleSignin.signIn()...');
      const userInfo = await GoogleSignin.signIn();
      console.log('GoogleSignin.signIn() completed');
      console.log('userInfo object:', JSON.stringify(userInfo, null, 2));
      
      // Get the ID token using the proper method
      const tokens = await GoogleSignin.getTokens();
      console.log('Extracted tokens:', tokens.accessToken ? 'Access Token Present' : 'NULL', tokens.idToken ? 'ID Token Present' : 'NULL');
      
      if (!tokens.idToken) {
        console.error('idToken is null! userInfo structure:', Object.keys(userInfo));
        throw new Error('Failed to get ID token from Google Sign-In. Please try again.');
      }

      // Create a Google credential with the ID token and access token
      console.log('Creating Google credential...');
      console.log('ID Token length:', tokens.idToken ? tokens.idToken.length : 0);
      console.log('Access Token length:', tokens.accessToken ? tokens.accessToken.length : 0);
      
      // Use both ID token and access token if available, otherwise just ID token
      const googleCredential = tokens.accessToken 
        ? auth.GoogleAuthProvider.credential(tokens.idToken, tokens.accessToken)
        : auth.GoogleAuthProvider.credential(tokens.idToken);
      
      console.log('Google credential created successfully');
      
      // Sign-in the user with the credential
      console.log('Signing in with Firebase...');
      const response = await auth().signInWithCredential(googleCredential);
      console.log('Firebase sign-in successful:', response.user.uid);
      
      // Create user in backend
      try {
        console.log('Creating user in backend...');
        console.log('API_BASE_URL:', API_BASE_URL);
        const backendResponse = await axios.post(`${API_BASE_URL}/users/create`, {
          userId: response.user.uid,
          name: response.user.displayName || response.user.email || 'Unknown',
        });
        console.log('User created in backend successfully:', backendResponse.data);
      } catch (backendError: any) {
        console.error('Backend user creation failed:', backendError);
        console.error('Backend error details:', backendError.response?.data || backendError.message);
        // Don't throw here - the user is still signed in to Firebase
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Google Sign-In failed. Please try again.';
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Authentication failed. Please try signing in again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Google Sign-In Failed', errorMessage);
      throw error;
    }
  };

  const appleSignIn = async () => {
    try {
      console.log('Apple Sign-In not implemented yet');
      Alert.alert('Coming Soon', 'Apple Sign-In will be available in a future update.');
    } catch (error: any) {
      console.error('Apple sign-in error:', error);
      Alert.alert('Apple Sign-In Failed', 'Apple Sign-In is not available yet.');
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    googleSignIn,
    appleSignIn,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 