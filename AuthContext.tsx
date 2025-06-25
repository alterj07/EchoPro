import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Alert } from 'react-native';
import axios from 'axios';

import firebase from '@react-native-firebase/app';

console.log('✅ Firebase app name:', firebase.apps[0]?.name);

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  googleSignIn: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const API_BASE_URL = 'http://localhost:3000/api'; // Change to your backend URL if needed

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
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert('Signup Failed', error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await auth().signOut();
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Failed', 'Failed to logout. Please try again.');
      throw error;
    }
  };

  const googleSignIn = async () => {
    try {
      // Get the users ID token
      const userInfo = await GoogleSignin.signIn();
      // Safely access idToken for compatibility with type definitions
      const idToken = (userInfo as any).data.idToken;

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      console.log('userinfo', userInfo);
      console.log('idToken', idToken);
      // Sign-in the user with the credential
      const response = await auth().signInWithCredential(googleCredential);
      console.log('Google sign-in successful:', response.user.uid);
      // Create user in backend
      await axios.post(`${API_BASE_URL}/users/create`, {
        userId: response.user.uid,
        name: response.user.displayName || response.user.email || 'Unknown',
      });
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      Alert.alert('Google Sign-In Failed', error.message);
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