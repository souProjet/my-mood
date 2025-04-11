import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Dimensions, SafeAreaView, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { router } from 'expo-router';
import MoodSlider from '../../components/MoodSlider';
import Animated, { 
  FadeIn, 
  SlideInRight, 
  FadeOut,
  SlideOutLeft,
  interpolate,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

type MoodType = 'mood' | 'energy' | 'anxiety' | 'focus';

interface MoodTypeConfig {
  title: string;
  question: string;
  emojis: string[];
  gradient: readonly [string, string];
  description: string;
}

const MOOD_TYPES: Record<MoodType, MoodTypeConfig> = {
  mood: {
    title: 'Mon humeur',
    question: 'Comment te sens-tu ?',
    emojis: ['😔', '😕', '😐', '😊', '😄'],
    gradient: ['#FFE3E3', '#FFB1B1'] as const,
    description: '',
  },
  energy: {
    title: 'Mon énergie',
    question: 'Ton niveau d\'énergie ?',
    emojis: ['😴', '😪', '😐', '⚡', '💪'],
    gradient: ['#E3F2FF', '#96BAFF'] as const,
    description: '',
  },
  anxiety: {
    title: 'Mon anxiété',
    question: 'Ton niveau de stress ?',
    emojis: ['😰', '😥', '😌', '😊', '🧘'],
    gradient: ['#F0EFFF', '#B4B0FF'] as const,
    description: '',
  },
  focus: {
    title: 'Ma concentration',
    question: 'Ta concentration ?',
    emojis: ['🌫️', '😵', '😐', '🎯', '🧠'],
    gradient: ['#FFE8E0', '#FFB992'] as const,
    description: '',
  },
};

const MOOD_ORDER: MoodType[] = ['mood', 'energy', 'anxiety', 'focus'];

export default function MoodScreen() {
  const [currentMoodIndex, setCurrentMoodIndex] = useState(0);
  const [moodValues, setMoodValues] = useState({
    mood: 0.5,
    energy: 0.5,
    anxiety: 0.5,
    focus: 0.5,
  });

  const scale = useSharedValue(1);
  const slideY = useSharedValue(0);

  const currentMood = MOOD_ORDER[currentMoodIndex];
  const config = MOOD_TYPES[currentMood] || MOOD_TYPES.mood;

  if (!config) {
    return null;
  }

  const saveMoodData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const moodData = {
        date: today,
        ...moodValues,
      };
      
      const existingDataStr = await AsyncStorage.getItem('moodData');
      const existingData = existingDataStr ? JSON.parse(existingDataStr) : [];
      const newData = [...existingData, moodData];
      await AsyncStorage.setItem('moodData', JSON.stringify(newData));
      
      router.replace('/stats');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMoodChange = (value: number) => {
    const currentMood = MOOD_ORDER[currentMoodIndex];
    setMoodValues(prev => ({ ...prev, [currentMood]: value }));

    if (currentMoodIndex < MOOD_ORDER.length - 1) {
      scale.value = withSpring(0.95, { mass: 0.5, damping: 12 });
      slideY.value = withSpring(-30, { mass: 0.5, damping: 12 });
      
      setTimeout(() => {
        setCurrentMoodIndex(prev => prev + 1);
        scale.value = withSpring(1, { mass: 0.5, damping: 12 });
        slideY.value = withSpring(0, { mass: 0.5, damping: 12 });
      }, 300);
    } else {
      scale.value = withSpring(0.9, { mass: 0.5, damping: 12 });
      slideY.value = withSpring(-50, { mass: 0.5, damping: 12 });
      
      setTimeout(() => {
        saveMoodData();
      }, 300);
    }
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: slideY.value }
    ],
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={config.gradient}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.date}>
            {format(new Date(), 'd MMMM', { locale: fr })}
          </Text>
        </View>

        <Animated.View
          key={currentMood}
          entering={SlideInRight.duration(500).springify()}
          exiting={SlideOutLeft.duration(300)}
          style={[styles.moodContainer, containerStyle]}
        >
          <View style={styles.questionContainer}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.question}>{config.question}</Text>
          </View>

          <View style={styles.sliderContainer}>
            <MoodSlider
              emojis={config.emojis}
              value={moodValues[currentMood]}
              onValueChange={handleMoodChange}
            />
          </View>
        </Animated.View>

        <View style={styles.progressContainer}>
          {MOOD_ORDER.map((_, index) => (
            <View 
              key={index}
              style={[
                styles.progressDot,
                index === currentMoodIndex && styles.progressDotActive,
                index < currentMoodIndex && styles.progressDotCompleted
              ]}
            />
          ))}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  header: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  date: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    textTransform: 'capitalize',
    opacity: 0.9,
  },
  moodContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  questionContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    opacity: 0.9,
    marginBottom: 4,
    textAlign: 'center',
  },
  question: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  sliderContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: 24,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  progressDotActive: {
    backgroundColor: '#000',
    transform: [{ scale: 1.2 }],
  },
  progressDotCompleted: {
    backgroundColor: '#000',
  },
});
