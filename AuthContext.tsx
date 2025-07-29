import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Remove Firebase imports since we're using MongoDB-based auth
// import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
// import firebase from '@react-native-firebase/app';

// console.log('✅ Firebase app name:', firebase.apps[0]?.name);
// console.log('✅ Firebase apps count:', firebase.apps.length);
// console.log('✅ Firebase default app:', firebase.app()?.name);

interface AuthContextType {
  user: any | null; // Changed from FirebaseAuthTypes.User to any
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<any>; // Changed return type
  signOut: () => Promise<void>;
  googleSignIn: () => Promise<void>;
  appleSignIn: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Dynamic API URL based on platform
const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3000/api'  // Android emulator
  : 'http://localhost:3000/api'; // iOS simulator

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false); // Start with false since we're not using Firebase auth state

  // Remove Firebase auth state listener since we're using MongoDB-based auth
  // useEffect(() => {
  //   const unsubscribe = auth().onAuthStateChanged((user) => {
  //     setUser(user);
  //     setLoading(false);
  //   });
  //   return unsubscribe;
  // }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Validate credentials against MongoDB database only
      const validationResponse = await axios.post(`${API_BASE_URL}/users/login`, {
        email: email,
        password: password
      });
      
      console.log('Login successful:', validationResponse.data);
      
      // Create a Firebase-compatible user object from the MongoDB user data
      const mongoUser = validationResponse.data.user;
      const firebaseUser = {
        uid: mongoUser.userId,
        email: mongoUser.email,
        displayName: mongoUser.name,
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        multiFactor: null,
        phoneNumber: null,
        photoURL: null,
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => '',
        getIdTokenResult: async () => ({ authTime: '', issuedAtTime: '', signInProvider: null, claims: {}, expirationTime: '', token: '' }),
        reload: async () => {},
        toJSON: () => ({}),
        providerId: 'password'
      } as any;
      
      // Clear any existing quiz state before setting the new user
      if (user?.uid && user.uid !== firebaseUser.uid) {
        try {
          const key = `quizState_${user.uid}`;
          await AsyncStorage.removeItem(key);
          console.log('Cleared quiz state for previous user:', user.uid);
        } catch (error) {
          console.error('Error clearing previous user quiz state:', error);
        }
      }
      
      // Also clear any existing quiz state for the new user to ensure fresh start
      try {
        const newUserKey = `quizState_${firebaseUser.uid}`;
        await AsyncStorage.removeItem(newUserKey);
        console.log('Cleared any existing quiz state for new user:', firebaseUser.uid);
      } catch (error) {
        console.error('Error clearing new user quiz state:', error);
      }
      
      // Set the user in our auth context
      setUser(firebaseUser);
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        Alert.alert('Account Not Found', 'No account found with this email address. Please sign up instead.');
      } else if (error.response?.status === 401) {
        if (error.response.data?.error === 'Invalid login method') {
          Alert.alert('Invalid Login Method', 'This account was created with a different login method. Please use the original sign-in method.');
        } else {
          Alert.alert('Invalid Credentials', 'Invalid email or password. Please try again.');
        }
      } else {
        Alert.alert('Login Failed', error.message || 'Login failed. Please try again.');
      }
      
      throw error;
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    try {
      // Create user in MongoDB with password only
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('SignUp Debug - Parameters received:');
      console.log('name:', name);
      console.log('email:', email);
      console.log('password:', password);
      
      const requestBody = {
        userId: userId,
        name: name, // Use the actual name parameter
        email: email,
        password: password // Password will be encrypted on the backend
      };
      
      console.log('SignUp Debug - Request body:', requestBody);
      
      const response = await axios.post(`${API_BASE_URL}/users/create`, requestBody);
      
      console.log('User created in MongoDB:', response.data);
      
      // Clear any existing progress data for the new user to ensure fresh start
      try {
        await axios.delete(`${API_BASE_URL}/users/${userId}/progress`);
        console.log('Cleared progress data for new user:', userId);
      } catch (error) {
        console.error('Error clearing progress for new user:', error);
      }
      
      // Create a Firebase-compatible user object from the MongoDB user data
      const mongoUser = response.data;
      const firebaseUser = {
        uid: mongoUser.userId,
        email: mongoUser.email,
        displayName: mongoUser.name,
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        multiFactor: null,
        phoneNumber: null,
        photoURL: null,
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => '',
        getIdTokenResult: async () => ({ authTime: '', issuedAtTime: '', signInProvider: null, claims: {}, expirationTime: '', token: '' }),
        reload: async () => {},
        toJSON: () => ({}),
        providerId: 'password'
      } as any;
      
      // Clear any existing quiz state before setting the new user
      if (user?.uid && user.uid !== firebaseUser.uid) {
        try {
          const key = `quizState_${user.uid}`;
          await AsyncStorage.removeItem(key);
          console.log('Cleared quiz state for previous user:', user.uid);
        } catch (error) {
          console.error('Error clearing previous user quiz state:', error);
        }
      }
      
      // Also clear any existing quiz state for the new user to ensure fresh start
      try {
        const newUserKey = `quizState_${firebaseUser.uid}`;
        await AsyncStorage.removeItem(newUserKey);
        console.log('Cleared any existing quiz state for new user:', firebaseUser.uid);
      } catch (error) {
        console.error('Error clearing new user quiz state:', error);
      }
      
      // Set the user in our auth context
      setUser(firebaseUser);
      
      return firebaseUser;
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        Alert.alert('Email Already Exists', 'An account with this email address already exists. Please sign in instead.');
      } else if (error.response?.status === 400) {
        Alert.alert('Invalid Input', 'Please check your input and try again.');
      } else {
        Alert.alert('Signup Failed', error.message || 'Signup failed. Please try again.');
      }
      
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear quiz state for the current user before signing out
      if (user?.uid) {
        try {
          // Clear quiz state from AsyncStorage
          const key = `quizState_${user.uid}`;
          await AsyncStorage.removeItem(key);
          console.log('Quiz state cleared for user:', user.uid);
        } catch (error) {
          console.error('Error clearing quiz state:', error);
        }
      }
      
      // Clear the user from our auth context (no Firebase needed)
      setUser(null);
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Failed', 'Failed to logout. Please try again.');
      throw error;
    }
  };

  const googleSignIn = async () => {
    // Temporarily disabled - using MongoDB-based authentication only
    Alert.alert('Google Sign-In', 'Google Sign-In is currently disabled. Please use email/password authentication.');
    throw new Error('Google Sign-In is currently disabled. Please use email/password authentication.');
    
    // try {
    //   console.log('Starting Google Sign-In process...');
      
    //   // Ensure Firebase is initialized
    //   // if (!firebase.apps.length) {
    //   //   console.error('Firebase not initialized!');
    //   //   throw new Error('Firebase not initialized. Please restart the app.');
    //   // }
      
    //   console.log('Firebase is initialized, proceeding with Google Sign-In...');
      
    //   // Check if user is already signed in
    //   // try {
    //   //   const currentUser = await GoogleSignin.getCurrentUser();
    //   //   if (currentUser) {
    //   //     await GoogleSignin.signOut();
    //   //     console.log('Signed out from previous Google Sign-In session');
    //   //   }
    //   // } catch (error) {
    //   //   console.log('No previous sign-in session found');
    //   // }
      
    //   // Get the users ID token
    //   console.log('Calling GoogleSignin.signIn()...');
    //   // const userInfo = await GoogleSignin.signIn();
    //   // console.log('GoogleSignin.signIn() completed');
    //   // console.log('userInfo object:', JSON.stringify(userInfo, null, 2));
      
    //   // Get the ID token using the proper method
    //   // const tokens = await GoogleSignin.getTokens();
    //   // console.log('Extracted tokens:', tokens.accessToken ? 'Access Token Present' : 'NULL', tokens.idToken ? 'ID Token Present' : 'NULL');
      
    //   // if (!tokens.idToken) {
    //   //   console.error('idToken is null! userInfo structure:', Object.keys(userInfo));
    //   //   throw new Error('Failed to get ID token from Google Sign-In. Please try again.');
    //   // }

    //   // Create a Google credential with the ID token and access token
    //   console.log('Creating Google credential...');
    //   // console.log('ID Token length:', tokens.idToken ? tokens.idToken.length : 0);
    //   // console.log('Access Token length:', tokens.accessToken ? tokens.accessToken.length : 0);
      
    //   // Use both ID token and access token if available, otherwise just ID token
    //   // const googleCredential = tokens.accessToken 
    //   //   ? auth.GoogleAuthProvider.credential(tokens.idToken, tokens.accessToken)
    //   //   : auth.GoogleAuthProvider.credential(tokens.idToken);
      
    //   // console.log('Google credential created successfully');
      
    //   // Sign-in the user with the credential
    //   console.log('Signing in with Firebase...');
    //   // const response = await auth().signInWithCredential(googleCredential);
    //   // console.log('Firebase sign-in successful:', response.user.uid);
      
    //   // Validate that the user exists in our backend with the correct Firebase UID
    //   // try {
    //   //   const validationResponse = await axios.post(`${API_BASE_URL}/users/login`, {
    //   //     email: response.user.email,
    //   //     firebaseUid: response.user.uid
    //   //   });
    //   //   console.log('User validated in backend:', validationResponse.data);
    //   // } catch (validationError: any) {
    //   //   console.error('Login validation failed:', validationError);
      
    //   //   if (validationError.response?.status === 404) {
    //   //     // User doesn't exist in our backend, sign them out from Firebase
    //   //     // await auth().signOut();
    //   //     Alert.alert('Account Not Found', 'No account found with this email address. Please sign up instead.');
    //   //     throw new Error('No account found with this email address. Please sign up instead.');
    //   //   }
      
    //   //   if (validationError.response?.status === 401) {
    //   //     // Invalid credentials (Firebase UID mismatch)
    //   //     // await auth().signOut();
    //   //     Alert.alert('Authentication Failed', 'Invalid credentials. Please check your email and password.');
    //   //     throw new Error('Invalid credentials. Please check your email and password.');
    //   //   }
      
    //   //   // For other backend errors, still allow login but log the error
    //   //   console.error('Backend validation failed, but proceeding with login');
    //   // }
      
    //   // Check if user exists in backend and create if needed
    //   // try {
    //   //   const backendResponse = await axios.get(`${API_BASE_URL}/users/${response.user.uid}`);
    //   //   console.log('User exists in backend:', backendResponse.data);
    //   // } catch (backendError: any) {
    //   //   console.error('User not found in backend:', backendError);
      
    //   //   // If user doesn't exist in backend, create them
    //   //   if (backendError.response?.status === 404) {
    //   //     try {
    //   //       console.log('Creating user in backend...');
    //   //       await axios.post(`${API_BASE_URL}/users/create`, {
    //   //         userId: response.user.uid,
    //   //         name: response.user.displayName || response.user.email || 'Unknown',
    //   //         email: response.user.email,
    //   //       });
    //   //       console.log('User created in backend successfully');
    //   //     } catch (createError: any) {
    //   //       console.error('Failed to create user in backend:', createError);
    //   //       // Don't fail the login, but log the error
    //   //     }
    //   //   }
    //   // }
    // } catch (error: any) {
    //   console.error('Google sign-in error:', error);
    //   Alert.alert('Google Sign-In Failed', error.message || 'Google sign-in failed. Please try again.');
    //   throw error;
    // }
  };

  const appleSignIn = async () => {
    // Temporarily disabled - using MongoDB-based authentication only
    Alert.alert('Apple Sign-In', 'Apple Sign-In is currently disabled. Please use email/password authentication.');
    throw new Error('Apple Sign-In is currently disabled. Please use email/password authentication.');
    
    // try {
    //   console.log('Starting Apple Sign-In process...');
      
    //   // Ensure Firebase is initialized
    //   if (!firebase.apps.length) {
    //     console.error('Firebase not initialized!');
    //     throw new Error('Firebase not initialized. Please restart the app.');
    //   }
      
    //   console.log('Firebase is initialized, proceeding with Apple Sign-In...');
      
    //   // Get the users ID token
    //   console.log('Calling AppleSignin.signInAsync()...');
    //   const userInfo = await AppleSignin.signInAsync({
    //     requestedScopes: [AppleSignin.Scope.EMAIL, AppleSignin.Scope.FULL_NAME],
    //   });
    //   console.log('AppleSignin.signInAsync() completed');
    //   console.log('userInfo object:', JSON.stringify(userInfo, null, 2));
      
    //   if (!userInfo.identityToken) {
    //     console.error('identityToken is null! userInfo structure:', Object.keys(userInfo));
    //     throw new Error('Failed to get identity token from Apple Sign-In. Please try again.');
    //   }

    //   // Create an Apple credential with the identity token
    //   console.log('Creating Apple credential...');
    //   console.log('Identity Token length:', userInfo.identityToken ? userInfo.identityToken.length : 0);
      
    //   const appleCredential = auth.AppleAuthProvider.credential(
    //     userInfo.identityToken,
    //     userInfo.nonce
    //   );
      
    //   console.log('Apple credential created successfully');
      
    //   // Sign-in the user with the credential
    //   console.log('Signing in with Firebase...');
    //   const response = await auth().signInWithCredential(appleCredential);
    //   console.log('Firebase sign-in successful:', response.user.uid);
      
    //   // Validate that the user exists in our backend with the correct Firebase UID
    //   try {
    //     const validationResponse = await axios.post(`${API_BASE_URL}/users/login`, {
    //       email: response.user.email,
    //       firebaseUid: response.user.uid
    //     });
    //     console.log('User validated in backend:', validationResponse.data);
    //   } catch (validationError: any) {
    //     console.error('Login validation failed:', validationError);
        
    //     if (validationError.response?.status === 404) {
    //       // User doesn't exist in our backend, sign them out from Firebase
    //       await auth().signOut();
    //       Alert.alert('Account Not Found', 'No account found with this email address. Please sign up instead.');
    //       throw new Error('No account found with this email address. Please sign up instead.');
    //     }
        
    //     if (validationError.response?.status === 401) {
    //       // Invalid credentials (Firebase UID mismatch)
    //       await auth().signOut();
    //       Alert.alert('Authentication Failed', 'Invalid credentials. Please check your email and password.');
    //       throw new Error('Invalid credentials. Please check your email and password.');
    //     }
        
    //     // For other backend errors, still allow login but log the error
    //     console.error('Backend validation failed, but proceeding with login');
    //   }
      
    //   // Check if user exists in backend and create if needed
    //   try {
    //     const backendResponse = await axios.get(`${API_BASE_URL}/users/${response.user.uid}`);
    //     console.log('User exists in backend:', backendResponse.data);
    //   } catch (backendError: any) {
    //     console.error('User not found in backend:', backendError);
        
    //     // If user doesn't exist in backend, create them
    //     if (backendError.response?.status === 404) {
    //       try {
    //         console.log('Creating user in backend...');
    //         await axios.post(`${API_BASE_URL}/users/create`, {
    //           userId: response.user.uid,
    //           name: response.user.displayName || response.user.email || 'Unknown',
    //           email: response.user.email,
    //         });
    //         console.log('User created in backend successfully');
    //       } catch (createError: any) {
    //         console.error('Failed to create user in backend:', createError);
    //         // Don't fail the login, but log the error
    //       }
    //     }
    //   }
    // } catch (error: any) {
    //   console.error('Apple sign-in error:', error);
    //   Alert.alert('Apple Sign-In Failed', error.message || 'Apple sign-in failed. Please try again.');
    //   throw error;
    // }
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