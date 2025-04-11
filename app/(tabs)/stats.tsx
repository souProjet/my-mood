import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

interface MoodEntry {
  date: string;
  mood: number;
  energy: number;
  anxiety: number;
  focus: number;
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
  withVerticalLabels: false,
  withHorizontalLabels: false,
  withVerticalLines: false,
  withHorizontalLines: false,
  fromZero: true,
  yAxisInterval: 1,
  yAxisSuffix: '',
  xAxisLabel: '',
};

const CHART_CONFIGS = {
  mood: {
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
  anxiety: {
    title: 'Anxiété',
    color: '#20C997',
    gradientColors: ['#20C997', '#63E6BE'],
    icon: '😰'
  },
  focus: {
    title: 'Concentration',
    color: '#845EF7',
    gradientColors: ['#845EF7', '#B197FC'],
    icon: '🌟'
  },
};

export default function StatsScreen() {
  const [moodData, setMoodData] = useState<MoodEntry[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadMoodData();
  }, []);

  const loadMoodData = async () => {
    try {
      console.log('Tentative de chargement des données...');
      const data = await AsyncStorage.getItem('moodData');
      console.log('Données brutes de AsyncStorage:', data);
      
      if (data) {
        const parsedData: MoodEntry[] = JSON.parse(data);
        console.log('Données parsées:', parsedData);
        parsedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setMoodData(parsedData);
      } else {
        console.log('Aucune donnée trouvée dans AsyncStorage');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const prepareChartData = (dataKey: keyof Omit<MoodEntry, 'date'>) => {
    console.log('Préparation des données pour:', dataKey);
    console.log('Données actuelles:', moodData);
    
    if (moodData.length === 0) {
      console.log('Aucune donnée disponible');
      return {
        labels: [''],
        datasets: [{
          data: [0],
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          strokeWidth: 2,
        }]
      };
    }

    // Filtrer les entrées du jour actuel uniquement
    const today = new Date().toISOString().split('T')[0];
    console.log('Date d\'aujourd\'hui:', today);
    const todayEntries = moodData.filter(entry => entry.date.startsWith(today));
    console.log('Entrées d\'aujourd\'hui:', todayEntries);
    
    if (todayEntries.length === 0) {
      console.log('Aucune entrée pour aujourd\'hui');
      return {
        labels: [''],
        datasets: [{
          data: [0],
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          strokeWidth: 2,
        }]
      };
    }

    // Utiliser la dernière entrée du jour
    const lastEntry = todayEntries[todayEntries.length - 1];
    const value = lastEntry[dataKey] || 0;
    console.log('Valeur pour', dataKey, ':', value);
    
    return {
      labels: [''],
      datasets: [
        {
          data: [value],
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

        {moodData.length === 0 ? (
          <Animated.View 
            entering={SlideInUp.duration(500)}
            style={styles.emptyState}
          >
            <Text style={styles.emptyStateTitle}>Aucune donnée disponible</Text>
            <Text style={styles.emptyStateText}>
              Commencez par enregistrer votre humeur pour voir vos statistiques.
            </Text>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => router.replace('/')}
            >
              <Text style={styles.buttonText}>Enregistrer mon humeur</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
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
                  withHorizontalLines={false}
                  withVerticalLabels={false}
                  withHorizontalLabels={false}
                  fromZero
                  segments={4}
                  withInnerLines={false}
                  yAxisInterval={1}
                  yAxisSuffix=""
                  xAxisLabel=""
                  hidePointsAtIndex={[]}
                  withDots={true}
                  withShadow={false}
                />
              </Animated.View>
            ))}
          </View>
        )}
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#4775EA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 