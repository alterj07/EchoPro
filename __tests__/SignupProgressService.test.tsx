/**
 * @format
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AuthProvider } from '../AuthContext';
import SignupScreen from '../screens/SignupScreen';
import progressService from '../services/progressService';

// Mock the progress service
jest.mock('../services/progressService', () => ({
  __esModule: true,
  default: {
    setUserId: jest.fn(),
    updatePreferences: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

// Mock Firebase auth
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    createUserWithEmailAndPassword: jest.fn().mockResolvedValue({
      user: {
        uid: 'test-user-id',
        updateProfile: jest.fn().mockResolvedValue(undefined),
      },
    }),
    onAuthStateChanged: jest.fn().mockReturnValue(() => {}),
  }),
}));

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({ data: {} }),
}));

// Mock Firebase app
jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: {
    apps: [{ name: 'test' }],
    app: () => ({ name: 'test' }),
  },
}));

describe('Signup Progress Service Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set user ID in progress service during signup', async () => {
    const { getByText, getByPlaceholderText } = render(
      <AuthProvider>
        <SignupScreen navigation={{}} />
      </AuthProvider>
    );

    // Fill in the form
    const nameInput = getByPlaceholderText('Enter your full name');
    const emailInput = getByPlaceholderText('Enter your email address');
    const passwordInput = getByPlaceholderText('Create a strong password');
    const confirmPasswordInput = getByPlaceholderText('Enter password again');

    fireEvent.changeText(nameInput, 'Test User');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'TestPass123');
    fireEvent.changeText(confirmPasswordInput, 'TestPass123');

    // Submit the form
    const signupButton = getByText('CREATE ACCOUNT');
    fireEvent.press(signupButton);

    await waitFor(() => {
      expect(progressService.setUserId).toHaveBeenCalledWith('test-user-id');
    });
  });

  it('should call updatePreferences after setting user ID', async () => {
    const { getByText, getByPlaceholderText } = render(
      <AuthProvider>
        <SignupScreen navigation={{}} />
      </AuthProvider>
    );

    // Fill in the form
    const nameInput = getByPlaceholderText('Enter your full name');
    const emailInput = getByPlaceholderText('Enter your email address');
    const passwordInput = getByPlaceholderText('Create a strong password');
    const confirmPasswordInput = getByPlaceholderText('Enter password again');

    fireEvent.changeText(nameInput, 'Test User');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'TestPass123');
    fireEvent.changeText(confirmPasswordInput, 'TestPass123');

    // Submit the form
    const signupButton = getByText('CREATE ACCOUNT');
    fireEvent.press(signupButton);

    await waitFor(() => {
      expect(progressService.setUserId).toHaveBeenCalledWith('test-user-id');
      expect(progressService.updatePreferences).toHaveBeenCalledWith({
        fontSize: 'medium',
        theme: 'auto',
        notifications: true, // default value
        dailyReminder: true, // default value
        reminderTime: '09:00'
      });
    });
  });
}); 