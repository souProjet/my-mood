import { Stack } from 'expo-router';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { router } from 'expo-router';

export default function TabLayout() {
  useEffect(() => {
    checkTodayEntry();
  }, []);

  const checkTodayEntry = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const existingDataStr = await AsyncStorage.getItem('moodData');
      const existingData = existingDataStr ? JSON.parse(existingDataStr) : [];
      
      const todayEntry = existingData.find((entry: any) => entry.date === today);
      if (todayEntry) {
        router.replace('/stats');
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.error('Error:', error);
      router.replace('/');
    }
  };

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="stats" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
    </Stack>
  );
}
