/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, Text, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NewAppScreen } from '@react-native/new-app-screen';
import DashboardScreen from './screens/DashboardScreen';
import ChecklistScreen from './screens/ChecklistScreen';
import PlayScreen from './screens/PlayScreen';
import SettingsScreen from './screens/SettingsScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import { FontSizeProvider } from './fontSizeContext';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
// import firebase from '@react-native-firebase/app';
import { QuizProvider } from './QuizContext';
import TrackPlayer from 'react-native-track-player';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

if (Platform.OS === 'ios') {
  const path = `${RNFS.MainBundlePath}/GoogleService-Info.plist`;
  RNFS.exists(path).then(exists => {
    console.log('Does GoogleService-Info.plist exist?', exists);
  });
}
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

// Initialize Firebase if it hasn't been initialized yet
// if (!firebase.apps.length) {
//   firebase.initializeApp({
//     apiKey: "AIzaSyDKxF1VtFVTPcbZwtke2zkE1SWh8XtSXdQ",
//     projectId: "echo-83a97",
//     storageBucket: "echo-83a97.firebasestorage.app",
//     appId: "1:709853471538:ios:5c201cc559cbb6ca0b6d2b",
//     messagingSenderId: "709853471538"
//   });
// // }
// console.log('🔥 Firebase Apps: ', firebase.apps);
// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '709853471538-lghod0kg73lrpsvrdr665gs2cao6uf7s.apps.googleusercontent.com', // Get this from Firebase console
});

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}
TrackPlayer.setupPlayer().then(() => {
  console.log('Track player ready');
});
function MainApp() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          let source;
          if (route.name === 'DashboardTab') {
            source = focused ? require('./assets/activatedDashboard.png') : require('./assets/deactivatedDashboard.png');
          } else if (route.name === 'Checklist') {
            source = focused ? require('./assets/activatedQuestions.png') : require('./assets/deactivatedQuestions.png');
          } else if (route.name === 'Play') {
            source = focused ? require('./assets/activatedPlayer.png') : require('./assets/deactivatedPlayer.png');
          }
          return <Image source={source} style={{ width: 24, height: 24, objectFit: 'contain' }} />;
        },
        tabBarActiveTintColor: '#222',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardStack} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Checklist" component={ChecklistScreen} />
      <Tab.Screen name="Play" component={PlayScreen} />
    </Tab.Navigator>
  );
}

function App(): React.JSX.Element {
  // const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      // setUser(user);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <QuizProvider>
      <FontSizeProvider>
        <NavigationContainer>
          {/* {user ? <MainApp /> : <AuthNavigator />} */}
          <MainApp />
        </NavigationContainer>
      </FontSizeProvider>
    </QuizProvider>
  );
}

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
