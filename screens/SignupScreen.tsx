import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../AuthContext';
import progressService from '../services/progressService';

interface SignupScreenProps {
  navigation: any;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bio, setBio] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [loading, setLoading] = useState(false);
  const { signUp, googleSignIn, appleSignIn, user } = useAuth();

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

  const handleEmailSignup = async () => {
    // Validation
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Please Complete', 'Please fill in all required fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      Alert.alert('Password Requirements', passwordValidation.message);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }

    setLoading(true);
    try {
      // Create user with Firebase Auth
      const newUser = await signUp(name.trim(), email.trim(), password);
      
      // Set up initial user preferences in progress service
      try {
        // Use the returned user from signUp
        console.log('hi');
        progressService.setUserId(newUser.uid);
        console.log('hi2');
        await progressService.updatePreferences({
          fontSize: 'medium',
          theme: 'auto',
          notifications: notificationsEnabled,
          dailyReminder: dailyReminder,
          reminderTime: '09:00'
        });
        console.log('hi3');
        // Update user profile with bio if provided
        if (bio.trim()) {
          await progressService.updateProfile({
            bio: bio.trim(),
            joinDate: new Date(),
            lastActive: new Date()
          });
        }
        console.log('hi4');
        Alert.alert(
          'Welcome to EchoPro! 🎵',
          'Your account has been created successfully. Start your 80s music journey!',
          [{ text: 'Get Started', onPress: () => {} }]
        );
      } catch (preferencesError) {
        console.error('Error setting up user preferences:', preferencesError);
        // Don't fail the signup if preferences setup fails
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = 'Signup failed. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Signup Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await googleSignIn();
      // Navigation will be handled automatically by auth state change
    } catch (error) {
      // Error is already handled in the context
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      await appleSignIn();
      // Navigation will be handled automatically by auth state change
    } catch (error) {
      // Error is already handled in the context
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>Join EchoPro to start your music journey</Text>

            <View style={styles.form}>
              {/* Full Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#888"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={50}
                  keyboardAppearance="light"
                  returnKeyType="next"
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
                  placeholderTextColor="#888"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={100}
                  keyboardAppearance="light"
                  returnKeyType="next"
                />
              </View>

              {/* Bio Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Bio (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell us about your music taste..."
                  placeholderTextColor="#888"
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  textAlignVertical="top"
                  keyboardAppearance="light"
                  returnKeyType="next"
                />
                <Text style={styles.characterCount}>{bio.length}/500</Text>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Create a strong password"
                  placeholderTextColor="#888"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  keyboardAppearance="light"
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    // Focus next input
                  }}
                />
                <Text style={styles.passwordHint}>
                  Must be at least 6 characters with uppercase, lowercase, and number
                </Text>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter password again"
                  placeholderTextColor="#888"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  keyboardAppearance="light"
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    Keyboard.dismiss();
                  }}
                />
              </View>

              {/* Preferences Section */}
              <View style={styles.preferencesSection}>
                <Text style={styles.sectionTitle}>Preferences</Text>
                
                <View style={styles.preferenceItem}>
                  <View style={styles.preferenceText}>
                    <Text style={styles.preferenceLabel}>Enable Notifications</Text>
                    <Text style={styles.preferenceDescription}>Get quiz reminders and achievements</Text>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: '#E0E0E0', true: '#2563EB' }}
                    thumbColor={notificationsEnabled ? '#FFFFFF' : '#FFFFFF'}
                  />
                </View>

                <View style={styles.preferenceItem}>
                  <View style={styles.preferenceText}>
                    <Text style={styles.preferenceLabel}>Daily Reminder</Text>
                    <Text style={styles.preferenceDescription}>Remind me to take daily quizzes</Text>
                  </View>
                  <Switch
                    value={dailyReminder}
                    onValueChange={setDailyReminder}
                    trackColor={{ false: '#E0E0E0', true: '#2563EB' }}
                    thumbColor={dailyReminder ? '#FFFFFF' : '#FFFFFF'}
                  />
                </View>
              </View>

              {/* Main Create Account Button */}
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, loading && styles.disabledButton]}
                onPress={handleEmailSignup}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Creating Account...' : 'CREATE ACCOUNT'}
                </Text>
              </TouchableOpacity>

              {/* Clear divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Alternative Sign Up Options */}
              <TouchableOpacity
                style={[styles.button, styles.googleButton, loading && styles.disabledButton]}
                onPress={handleGoogleSignIn}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.appleButton, loading && styles.disabledButton]}
                onPress={handleAppleSignIn}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.appleButtonText}>Continue with Apple</Text>
              </TouchableOpacity>

              {/* Clear sign in link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                  <Text style={styles.linkText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 20,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 60,
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 3,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    fontSize: 18,
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
    minHeight: 60,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
    paddingBottom: 16,
  },
  characterCount: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'right',
    marginTop: 4,
  },
  passwordHint: {
    fontSize: 14,
    color: '#666666',
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  preferencesSection: {
    marginBottom: 32,
    marginTop: 8,
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  preferenceText: {
    flex: 1,
    marginRight: 16,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#666666',
  },
  button: {
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderWidth: 0,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#E0E0E0',
  },
  appleButton: {
    backgroundColor: '#000000',
    borderWidth: 0,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  googleButtonText: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '600',
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 20,
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#F0F0F0',
  },
  footerText: {
    color: '#666666',
    fontSize: 18,
  },
  linkText: {
    color: '#2563EB',
    fontSize: 18,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default SignupScreen; 