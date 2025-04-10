import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder, Vibration } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  runOnJS,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 96;
const CIRCLE_SIZE = CARD_WIDTH - 40;
const EMOJI_SIZE = 48;
const CURSOR_SIZE = 52;

interface MoodSliderProps {
  title: string;
  emojis: string[];
  value: number;
  onValueChange: (value: number) => void;
}

export default function MoodSlider({ emojis, value, onValueChange }: MoodSliderProps) {
  const angle = useSharedValue(180);
  const scale = useSharedValue(1);
  const emojiScale = useSharedValue(1);
  const isDragging = useSharedValue(false);

  useEffect(() => {
    angle.value = interpolate(value, [0, 1], [0, 180]);
  }, [value]);

  const calculateValue = (angle: number) => {
    const normalizedAngle = Math.max(0, Math.min(180, angle));
    return normalizedAngle / 180;
  };

  const handleValueChange = (newValue: number) => {
    Vibration.vibrate(5); // Subtle haptic feedback
    onValueChange(newValue);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      scale.value = withSpring(1.1, {
        mass: 0.5,
        damping: 10,
        stiffness: 100,
      });
      emojiScale.value = withSpring(1.2, {
        mass: 0.5,
        damping: 10,
        stiffness: 100,
      });
      isDragging.value = true;
    },
    onPanResponderMove: (_, { moveX, moveY }) => {
      const centerX = CIRCLE_SIZE / 2;
      const centerY = CIRCLE_SIZE / 2;
      
      const deltaX = moveX - (centerX + (SCREEN_WIDTH - CARD_WIDTH) / 2);
      const deltaY = moveY - (centerY + 100);

      let newAngle = Math.atan2(deltaX, -deltaY) * (180 / Math.PI) + 90;
      newAngle = Math.max(0, Math.min(180, newAngle));
      
      angle.value = withTiming(newAngle, {
        duration: 50,
      });
      
      const newValue = calculateValue(newAngle);
      runOnJS(handleValueChange)(newValue);
    },
    onPanResponderRelease: () => {
      scale.value = withSequence(
        withSpring(0.95, { duration: 100 }),
        withSpring(1, { mass: 0.5, damping: 12 })
      );
      emojiScale.value = withSequence(
        withSpring(0.9, { duration: 100 }),
        withSpring(1, { mass: 0.5, damping: 12 })
      );
      isDragging.value = false;
    },
  });

  const cursorStyle = useAnimatedStyle(() => {
    const radians = (angle.value - 90) * (Math.PI / 180);
    const radius = CIRCLE_SIZE / 2;
    const x = radius + radius * Math.cos(radians);
    const y = radius + radius * Math.sin(radians);

    return {
      transform: [
        { translateX: x - CURSOR_SIZE / 2 },
        { translateY: y - CURSOR_SIZE / 2 },
        { scale: scale.value },
        { rotate: `${angle.value}deg` },
      ],
      shadowOpacity: interpolate(isDragging.value ? 1 : 0, [0, 1], [0.2, 0.4]),
      shadowRadius: interpolate(isDragging.value ? 1 : 0, [0, 1], [4, 8]),
    };
  });

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  const getEmojiForAngle = () => {
    const progress = angle.value / 180;
    const index = Math.min(
      emojis.length - 1,
      Math.floor(progress * emojis.length)
    );
    return emojis[index];
  };

  return (
    <View style={styles.container}>
      <View style={styles.circleContainer}>
        <LinearGradient
          colors={['#F1F3F5', '#E9ECEF']}
          style={styles.circleBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.circle}>
          <LinearGradient
            colors={['#4775EA', '#6D8DFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.progressArc,
              {
                transform: [
                  { rotate: `${angle.value}deg` },
                ],
              },
            ]}
          />
          <Animated.View
            style={[styles.cursor, cursorStyle]}
            {...panResponder.panHandlers}
          >
            <Animated.Text style={[styles.cursorEmoji, emojiStyle]}>
              {getEmojiForAngle()}
            </Animated.Text>
          </Animated.View>
        </View>
      </View>

      <View style={styles.labelContainer}>
        <Text style={styles.label}>Pas bien</Text>
        <Text style={styles.label}>Très bien</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    alignItems: 'center',
    paddingTop: 20,
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE / 2,
    overflow: 'hidden',
  },
  circleBackground: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressArc: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    transform: [
      { rotate: '180deg' },
    ],
  },
  cursor: {
    position: 'absolute',
    width: CURSOR_SIZE,
    height: CURSOR_SIZE,
    borderRadius: CURSOR_SIZE / 2,
    backgroundColor: 'white',
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
    borderWidth: 3,
    borderColor: '#4775EA',
  },
  cursorEmoji: {
    fontSize: EMOJI_SIZE,
    textAlign: 'center',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
    opacity: 0.7,
  },
}); 