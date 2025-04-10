import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: 'rgba(0, 0, 0, 0.4)',
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          elevation: 0,
          borderTopWidth: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 24,
          height: 64,
          paddingBottom: 8,
          paddingTop: 12,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 8,
          },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          ...Platform.select({
            ios: {
              backdropFilter: 'blur(20px)',
            },
          }),
        },
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mood',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "add-circle" : "add-circle-outline"} 
              size={28} 
              color={color}
              style={{
                transform: [{ scale: focused ? 1.1 : 1 }]
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "stats-chart" : "stats-chart-outline"}
              size={24} 
              color={color}
              style={{
                transform: [{ scale: focused ? 1.1 : 1 }]
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "settings" : "settings-outline"}
              size={24} 
              color={color}
              style={{
                transform: [{ scale: focused ? 1.1 : 1 }]
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
