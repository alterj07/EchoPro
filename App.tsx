import React, { useEffect } from 'react';
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
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { QuizProvider } from './QuizContext';
import { AuthProvider, useAuth } from './AuthContext';
import TrackPlayer from 'react-native-track-player';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import firebase from '@react-native-firebase/app';
import { getApp } from '@react-native-firebase/app';



if (Platform.OS === 'ios') {
  const path = `${RNFS.MainBundlePath}/GoogleService-Info.plist`;
  RNFS.exists(path).then(exists => {
    console.log('Does GoogleService-Info.plist exist?', exists);
  });
}

// Configure Google Sign-In


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

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

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <FontSizeProvider>
      <NavigationContainer>
        {user ? <MainApp /> : <AuthNavigator />}
      </NavigationContainer>
    </FontSizeProvider>
  );
}

function App(): React.JSX.Element {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '709853471538-lghod0kg73lrpsvrdr665gs2cao6uf7s.apps.googleusercontent.com',
      iosClientId: '709853471538-kbbdlgl028b3fo9o0ihf9ckpdnvfvvd9.apps.googleusercontent.com',
      offlineAccess: true,
    });
    console.log('GoogleSignin configured with webClientId:', '709853471538-lghod0kg73lrpsvrdr665gs2cao6uf7s.apps.googleusercontent.com');
    console.log('GoogleSignin configured with iosClientId:', '709853471538-kbbdlgl028b3fo9o0ihf9ckpdnvfvvd9.apps.googleusercontent.com');
  }, []);
  return (
    <AuthProvider>
      <QuizProvider>
        <AppContent />
      </QuizProvider>
    </AuthProvider>
  );
}

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
