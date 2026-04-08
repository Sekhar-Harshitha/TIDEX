import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { CloudSun, Radio, ShieldCheck, Network, Map, Share2 } from 'lucide-react-native';

// Mock Screens (In a real app, these would be in separate files)
import { HomeScreen } from './src/screens/HomeScreen';
import { ReportScreen } from './src/screens/ReportScreen';
import { SafetyScreen } from './src/screens/SafetyScreen';
import { ConnectScreen } from './src/screens/ConnectScreen';
import { MapScreen } from './src/screens/MapScreen';
import { SocialScreen } from './src/screens/SocialScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let icon;
            if (route.name === 'Weather') icon = <CloudSun size={size} color={color} />;
            else if (route.name === 'Report') icon = <Radio size={size} color={color} />;
            else if (route.name === 'Safety') icon = <ShieldCheck size={size} color={color} />;
            else if (route.name === 'Connect') icon = <Network size={size} color={color} />;
            else if (route.name === 'Map') icon = <Map size={size} color={color} />;
            else if (route.name === 'Social') icon = <Share2 size={size} color={color} />;
            return icon;
          },
          tabBarActiveTintColor: '#0ea5e9',
          tabBarInactiveTintColor: 'gray',
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#fff',
          tabBarStyle: { height: 60, paddingBottom: 10 },
        })}
      >
        <Tab.Screen name="Weather" component={HomeScreen} />
        <Tab.Screen name="Report" component={ReportScreen} />
        <Tab.Screen name="Safety" component={SafetyScreen} />
        <Tab.Screen name="Connect" component={ConnectScreen} />
        <Tab.Screen name="Map" component={MapScreen} />
        <Tab.Screen name="Social" component={SocialScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
