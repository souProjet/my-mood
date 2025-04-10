import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface MoodEntry {
  date: string;
  general: number;
  energy: number;
  stress: number;
  satisfaction: number;
}

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 48; // Ajustement pour les marges

const chartConfig = {
  backgroundColor: 'transparent',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(71, 117, 234, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#4775EA',
  },
  propsForLabels: {
    fontSize: 11,
    fontWeight: '600',
  },
  paddingRight: 0,
  paddingLeft: 0,
};

const CHART_CONFIGS = {
  general: {
    title: 'Humeur',
    color: '#4775EA',
    gradientColors: ['#4775EA', '#6D8DFF'],
    icon: '😊'
  },
  energy: {
    title: 'Énergie',
    color: '#FF6B6B',
    gradientColors: ['#FF6B6B', '#FFA8A8'],
    icon: '⚡'
  },
  stress: {
    title: 'Stress',
    color: '#20C997',
    gradientColors: ['#20C997', '#63E6BE'],
    icon: '😰'
  },
  satisfaction: {
    title: 'Satisfaction',
    color: '#845EF7',
    gradientColors: ['#845EF7', '#B197FC'],
    icon: '🌟'
  },
};

export default function StatsScreen() {
  const [moodData, setMoodData] = useState<MoodEntry[]>([]);

  useEffect(() => {
    loadMoodData();
  }, []);

  const loadMoodData = async () => {
    try {
      const data = await AsyncStorage.getItem('moodData');
      if (data) {
        const parsedData: MoodEntry[] = JSON.parse(data);
        parsedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setMoodData(parsedData);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const prepareChartData = (dataKey: keyof Omit<MoodEntry, 'date'>) => {
    if (moodData.length === 0) {
      return {
        labels: [],
        datasets: [{
          data: [],
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          strokeWidth: 2,
        }]
      };
    }

    const last7Days = moodData.slice(-7);
    return {
      labels: last7Days.map(d => format(new Date(d.date), 'E', { locale: fr })),
      datasets: [
        {
          data: last7Days.map(d => d[dataKey] * 100),
          color: (opacity = 1) => `rgba(${hexToRgb(CHART_CONFIGS[dataKey].color)}, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#F8F9FA', '#ffffff']}
        style={styles.gradientBackground}
      >
        <Animated.View 
          entering={FadeIn.duration(800)}
          style={styles.header}
        >
          <Text style={styles.title}>Statistiques</Text>
        </Animated.View>

        <View style={styles.chartsContainer}>
          {(Object.entries(CHART_CONFIGS) as [keyof Omit<MoodEntry, 'date'>, any][]).map(([key, config], index) => (
            <Animated.View
              key={key}
              entering={SlideInUp.delay(index * 100).duration(500)}
              style={styles.chartCard}
            >
              <View style={styles.chartHeader}>
                <Text style={styles.chartIcon}>{config.icon}</Text>
                <Text style={[styles.chartTitle, { color: config.color }]}>{config.title}</Text>
              </View>
              <LinearGradient
                colors={config.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBorder}
              />
              <LineChart
                data={prepareChartData(key)}
                width={chartWidth}
                height={160}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(${hexToRgb(config.color)}, ${opacity})`,
                  propsForDots: {
                    ...chartConfig.propsForDots,
                    stroke: config.color,
                  },
                }}
                bezier
                style={styles.chart}
                withVerticalLines={false}
                withHorizontalLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                fromZero
                segments={4}
                withInnerLines={false}
                yAxisInterval={1}
                yAxisSuffix="%"
              />
            </Animated.View>
          ))}
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  gradientBackground: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#868E96',
    fontWeight: '500',
  },
  chartsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  chartCard: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    paddingRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  gradientBorder: {
    height: 3,
    borderRadius: 1.5,
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
    marginLeft: -20,
  },
}); 