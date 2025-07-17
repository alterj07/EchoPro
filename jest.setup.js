// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: Object.assign(
    () => ({
      apps: [{ name: 'test' }],
      app: () => ({ name: 'test' }),
    }),
    {
      apps: [{ name: 'test' }],
      app: () => ({ name: 'test' }),
    }
  ),
}));

// Mock Firebase Auth
jest.mock('@react-native-firebase/auth', () => {
  const authImpl = {
    onAuthStateChanged: jest.fn((cb) => {
      cb(null); // Simulate no user signed in
      return jest.fn(); // Unsubscribe function
    }),
    signInWithCredential: jest.fn(),
    AppleAuthProvider: { credential: jest.fn() },
    GoogleAuthProvider: { credential: jest.fn() },
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  };
  function auth() {
    return authImpl;
  }
  // Assign methods to the function itself for static usage
  Object.assign(auth, authImpl);
  return {
    __esModule: true,
    default: auth,
    GoogleAuthProvider: { credential: jest.fn() },
    AppleAuthProvider: { credential: jest.fn() },
  };
});

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

// Mock @react-native-google-signin/google-signin
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    hasPlayServices: jest.fn().mockResolvedValue(true),
    configure: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getCurrentUser: jest.fn(),
    getTokens: jest.fn().mockResolvedValue({ idToken: 'test-id-token', accessToken: 'test-access-token' }),
  },
})); 