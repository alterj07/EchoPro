module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@invertase|@react-native-google-signin)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
