import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const SLIDER_HEIGHT = 350;
const TOTAL_STEPS = 5; // Nombre total d'états
const STEP_HEIGHT = SLIDER_HEIGHT / TOTAL_STEPS; // 4 intervalles pour 5 états

interface MoodSliderProps {
  emojis: string[];
  value: number;
  onValueChange: (value: number) => void;
}

export default function MoodSlider({ emojis, value, onValueChange }: MoodSliderProps) {
  const translateY = useSharedValue(-1); // Valeur initiale à -1 pour indiquer aucune position

  const handlePress = (index: number) => {
    const newValue = index / (TOTAL_STEPS - 1);
    translateY.value = withSpring(index * STEP_HEIGHT, {
      damping: 20,
      stiffness: 150,
      mass: 0.5,
      velocity: 0,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
    });
    onValueChange(newValue);
  };

  const cursorStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: withSpring(translateY.value === -1 ? 0 : 1, {
      damping: 20,
      stiffness: 100,
    }),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.sliderTrack}>
        <LinearGradient
          colors={['#F1F3F5', '#E9ECEF']}
          style={styles.trackBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.steps}>
          {[0, 1, 2, 3, 4].map((step) => (
            <Pressable
              key={step}
              style={styles.step}
              onPress={() => handlePress(step)}
            >
              <Text style={styles.stepEmoji}>{emojis[step]}</Text>
            </Pressable>
          ))}
        </View>
        <Animated.View style={[styles.cursor, cursorStyle]}>
          <Text style={styles.cursorEmoji}>
            {emojis[Math.round(value * (TOTAL_STEPS - 1))]}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sliderTrack: {
    height: SLIDER_HEIGHT,
    width: 60,
    backgroundColor: 'transparent',
    borderRadius: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  trackBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  steps: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingVertical: 0,
    height: SLIDER_HEIGHT,
  },
  step: {
    width: '100%',
    height: STEP_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 0,
  },
  stepEmoji: {
    fontSize: 24,
    opacity: 0.5,
    textAlign: 'center',
    lineHeight: STEP_HEIGHT,
  },
  cursor: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cursorEmoji: {
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 30,
  },
}); 