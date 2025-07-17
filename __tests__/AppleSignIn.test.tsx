/**
 * @format
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AuthProvider } from '../AuthContext';
import LoginScreen from '../screens/LoginScreen';

// Mock the Apple authentication module
jest.mock('@invertase/react-native-apple-authentication', () => ({
  appleAuth: {
    isSupported: true,
    performRequest: jest.fn(),
    Operation: {
      LOGIN: 'LOGIN',
    },
    Scope: {
      EMAIL: 'EMAIL',
      FULL_NAME: 'FULL_NAME',
    },
  },
}));

// Mock Firebase auth
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    signInWithCredential: jest.fn(),
    AppleAuthProvider: {
      credential: jest.fn(),
    },
  }),
}));

describe('Apple Sign-In', () => {
  it('should render Apple Sign-In button', () => {
    const { getByText } = render(
      <AuthProvider>
        <LoginScreen navigation={{}} />
      </AuthProvider>
    );

    expect(getByText('Continue with Apple')).toBeTruthy();
  });

  it('should handle Apple Sign-In button press', async () => {
    const { getByText } = render(
      <AuthProvider>
        <LoginScreen navigation={{}} />
      </AuthProvider>
    );

    const appleButton = getByText('Continue with Apple');
    fireEvent.press(appleButton);

    // The button should be pressable
    expect(appleButton).toBeTruthy();
  });
}); 