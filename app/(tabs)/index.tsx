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
    question: 'Comment te sens-tu maintenant ?',
    emojis: ['😔', '😐', '😊'],
    gradient: ['#FF6B6B', '#FFB1B1'] as const,
    description: 'Ton humeur générale reflète ton état émotionnel du moment',
  },
  energy: {
    title: 'Mon énergie',
    question: 'Quel est ton niveau d\'énergie ?',
    emojis: ['🔋', '⚡', '💪'],
    gradient: ['#4D96FF', '#96BAFF'] as const,
    description: 'Ton niveau d\'énergie impacte ta productivité et ton bien-être',
  },
  anxiety: {
    title: 'Mon anxiété',
    question: 'Comment gères-tu ton stress ?',
    emojis: ['😰', '😌', '🧘'],
    gradient: ['#6C63FF', '#B4B0FF'] as const,
    description: 'Le stress fait partie de la vie, mais il est important de le gérer',
  },
  focus: {
    title: 'Ma concentration',
    question: 'Es-tu concentré aujourd\'hui ?',
    emojis: ['🌫️', '🎯', '🎪'],
    gradient: ['#FF9F7F', '#FFB992'] as const,
    description: 'Ta capacité à rester concentré est essentielle pour atteindre tes objectifs',
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

  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const slideY = useSharedValue(50);

  useEffect(() => {
    checkTodayEntry();
    progress.value = withSpring(1, { mass: 0.5, damping: 12 });
    slideY.value = withSpring(0, { mass: 0.5, damping: 12 });
  }, []);

  const checkTodayEntry = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const existingDataStr = await AsyncStorage.getItem('moodData');
      const existingData = existingDataStr ? JSON.parse(existingDataStr) : [];
      
      const todayEntry = existingData.find((entry: any) => entry.date === today);
      if (todayEntry) {
        router.replace('/stats');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

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

  const handleSkip = () => {
    if (currentMoodIndex < MOOD_ORDER.length - 1) {
      setCurrentMoodIndex(prev => prev + 1);
    }
  };

  const currentMood = MOOD_ORDER[currentMoodIndex];
  const config = MOOD_TYPES[currentMood];

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: slideY.value }
    ],
    opacity: progress.value,
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
        <Animated.View 
          entering={FadeIn.duration(800)}
          style={[styles.header, containerStyle]}
        >
          <Text style={styles.date}>
            {format(new Date(), 'd MMMM', { locale: fr })}
          </Text>
          <Text style={styles.subtitle}>Comment vas-tu aujourd'hui ?</Text>
        </Animated.View>

        <Animated.View
          key={currentMood}
          entering={SlideInRight.duration(500).springify()}
          exiting={SlideOutLeft.duration(300)}
          style={[styles.moodContainer, containerStyle]}
        >
          <View style={styles.questionContainer}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.question}>{config.question}</Text>
            <Text style={styles.description}>{config.description}</Text>
          </View>

          <View style={styles.sliderContainer}>
            <MoodSlider
              title={config.title}
              emojis={config.emojis}
              value={moodValues[currentMood]}
              onValueChange={handleMoodChange}
            />
          </View>

          <Pressable 
            onPress={handleSkip} 
            style={({pressed}) => [
              styles.skipButton,
              pressed && styles.skipButtonPressed
            ]}
          >
            <Text style={styles.skipText}>Passer cette question</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.progressContainer}>
          {MOOD_ORDER.map((_, index) => (
            <Animated.View 
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
    paddingVertical: 40,
  },
  header: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  date: {
    fontSize: 42,
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
    marginBottom: 40,
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    opacity: 0.9,
    marginBottom: 12,
    textAlign: 'center',
  },
  question: {
    fontSize: 24,
    fontWeight: '500',
    color: '#000',
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    color: '#000',
    opacity: 0.6,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 22,
  },
  sliderContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: 24,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  progressDotActive: {
    backgroundColor: '#000',
    transform: [{ scale: 1.2 }],
  },
  progressDotCompleted: {
    backgroundColor: '#000',
  },
  subtitle: {
    fontSize: 18,
    color: '#000',
    opacity: 0.6,
    marginTop: 8,
  },
  skipButton: {
    marginTop: 30,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  skipButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  skipText: {
    fontSize: 16,
    color: '#000',
    opacity: 0.6,
    fontWeight: '500',
  },
});
