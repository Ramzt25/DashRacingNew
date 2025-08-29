import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, ViewStyle } from 'react-native';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import GarageScreen from '../screens/GarageScreen';
import RaceScreen from '../screens/RaceScreen';
import MapScreen from '../screens/MapScreen';
import MeetupScreen from '../screens/MeetupScreen';
import FriendsScreen from '../screens/FriendsScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Import components
import { useApp } from '../context/AppContext';
import LoadingScreen from '../components/common/LoadingScreen';
import { colors, spacing, typography } from '../utils/theme';

// Navigation types
import { MainTabParamList, RootStackParamList } from '../../../shared/types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Tab Bar Icon Component
const TabIcon: React.FC<{ icon: string; focused: boolean }> = ({ icon, focused }) => (
  <Text style={{ 
    fontSize: 24, 
    color: focused ? colors.primary : colors.textSecondary 
  }}>
    {icon}
  </Text>
);

// Main Tab Navigator
const MainTabNavigator: React.FC = () => {
  const { state, actions } = useApp();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceSecondary,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: spacing.sm,
          paddingTop: spacing.sm,
        } as ViewStyle,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
      screenListeners={{
        tabPress: (e) => {
          // Track active tab for state management
          const tabName = e.target?.split('-')[0] || 'Home';
          actions.setActiveTab(tabName);
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
          tabBarLabel: 'Home',
        }}
      />
      
      <Tab.Screen
        name="Garage"
        component={GarageScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🏎️" focused={focused} />,
          tabBarLabel: 'Garage',
        }}
      />
      
      <Tab.Screen
        name="Race"
        component={RaceScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🏁" focused={focused} />,
          tabBarLabel: 'Race',
        }}
      />
      
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🗺️" focused={focused} />,
          tabBarLabel: 'Map',
        }}
      />
      
      <Tab.Screen
        name="Meetup"
        component={MeetupScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📅" focused={focused} />,
          tabBarLabel: 'Events',
        }}
      />
      
      <Tab.Screen
        name="Friends"
        component={FriendsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="👥" focused={focused} />,
          tabBarLabel: 'Friends',
          tabBarBadge: state.notifications.length > 0 ? state.notifications.length : undefined,
        }}
      />
      
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />,
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

// Root Stack Navigator
const RootNavigator: React.FC = () => {
  const { state } = useApp();

  if (state.isLoading) {
    return <LoadingScreen message="Initializing Dash Racing..." />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ gestureEnabled: false }}
      />
      
      {/* Modal screens can be added here */}
      {/* 
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'Profile',
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
        }}
      />
      */}
    </Stack.Navigator>
  );
};

// Main App Navigator
const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.textPrimary,
          border: colors.surfaceSecondary,
          notification: colors.primary,
        },
      }}
    >
      <RootNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;