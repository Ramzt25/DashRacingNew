import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppProvider} from './context/AppContext';
import AuthWrapper from './components/AuthWrapper';

// Import screens
import HomeScreen from './screens/HomeScreen';
import GarageScreen from './screens/GarageScreen';
import RaceScreen from './screens/RaceScreen';
import MapScreen from './screens/MapScreen';
import FriendsScreen from './screens/FriendsScreen';
import MeetupScreen from './screens/MeetupScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 0, // Let SafeAreaView handle safe area
          height: 60, // Fixed height for consistent layout
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Garage" component={GarageScreen} />
      <Tab.Screen name="Race" component={RaceScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Meetup" component={MeetupScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AuthWrapper>
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen 
                name="Main" 
                component={MainTabs} 
                options={{headerShown: false}}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </AuthWrapper>
      </AppProvider>
    </SafeAreaProvider>
  );
}