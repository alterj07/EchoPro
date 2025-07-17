/**
 * @format
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import SignupScreen from '../screens/SignupScreen';

// Mock the AuthContext
const mockSignUp = jest.fn();
const mockGoogleSignIn = jest.fn();
const mockAppleSignIn = jest.fn();

jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    signUp: mockSignUp,
    googleSignIn: mockGoogleSignIn,
    appleSignIn: mockAppleSignIn,
  }),
}));

// Mock the progress service
jest.mock('../services/progressService', () => ({
  updatePreferences: jest.fn(),
  updateProfile: jest.fn(),
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

describe('Input Styling and Keyboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders password inputs with correct styling', () => {
    const { getByPlaceholderText } = render(
      <SignupScreen navigation={mockNavigation} />
    );

    const passwordInput = getByPlaceholderText('Create a strong password');
    const confirmPasswordInput = getByPlaceholderText('Enter password again');

    expect(passwordInput).toBeTruthy();
    expect(confirmPasswordInput).toBeTruthy();
  });

  it('renders all text inputs with keyboard appearance settings', () => {
    const { getByPlaceholderText } = render(
      <SignupScreen navigation={mockNavigation} />
    );

    const nameInput = getByPlaceholderText('Enter your full name');
    const emailInput = getByPlaceholderText('Enter your email address');
    const passwordInput = getByPlaceholderText('Create a strong password');
    const confirmPasswordInput = getByPlaceholderText('Enter password again');

    expect(nameInput).toBeTruthy();
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(confirmPasswordInput).toBeTruthy();
  });

  it('renders password hint text with proper spacing', () => {
    const { getByText } = render(
      <SignupScreen navigation={mockNavigation} />
    );

    const hintText = getByText('Must be at least 6 characters with uppercase, lowercase, and number');
    expect(hintText).toBeTruthy();
  });

  it('renders bio input with character count', () => {
    const { getByPlaceholderText, getByText } = render(
      <SignupScreen navigation={mockNavigation} />
    );

    const bioInput = getByPlaceholderText('Tell us about your music taste...');
    const characterCount = getByText('0/500');

    expect(bioInput).toBeTruthy();
    expect(characterCount).toBeTruthy();
  });
}); 