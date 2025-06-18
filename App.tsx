/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NewAppScreen } from '@react-native/new-app-screen';
import DashboardScreen from './screens/DashboardScreen';
import ChecklistScreen from './screens/ChecklistScreen';
import PlayScreen from './screens/PlayScreen';
import SettingsScreen from './screens/SettingsScreen';
import { FontSizeProvider } from './fontSizeContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <FontSizeProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ color, size }) => {
              let iconName;
              if (route.name === 'DashboardTab') {
                iconName = 'time-outline';
              } else if (route.name === 'Checklist') {
                iconName = 'checkbox-outline';
              } else if (route.name === 'Play') {
                iconName = 'play-circle-outline';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#222',
            tabBarInactiveTintColor: 'gray',
          })}
        >
          <Tab.Screen name="DashboardTab" component={DashboardStack} options={{ title: 'Dashboard' }} />
          <Tab.Screen name="Checklist" component={ChecklistScreen} />
          <Tab.Screen name="Play" component={PlayScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </FontSizeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
