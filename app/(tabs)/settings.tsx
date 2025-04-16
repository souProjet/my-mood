import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Platform, TouchableOpacity, Alert, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const defaultTime = new Date().setHours(22, 0, 0, 0);
  const [notificationTime, setNotificationTime] = useState(new Date(defaultTime));
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem('notificationsEnabled');
      const time = await AsyncStorage.getItem('notificationTime');
      
      if (enabled === null) {
        await saveSettings(true, new Date(defaultTime));
      } else {
        setNotificationsEnabled(enabled === 'true');
      }

      if (time) {
        setNotificationTime(new Date(time));
      } else {
        setNotificationTime(new Date(defaultTime));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const saveSettings = async (enabled: boolean, time: Date) => {
    try {
      await AsyncStorage.setItem('notificationsEnabled', enabled.toString());
      await AsyncStorage.setItem('notificationTime', time.toISOString());
      
      if (enabled) {
        await scheduleNotification(time);
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const scheduleNotification = async (time: Date) => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const hours = time.getHours();
    const minutes = time.getMinutes();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Comment s'est passée votre journée ?",
        body: "N'oubliez pas de suivre votre humeur !",
      },
      trigger: {
        type: 'daily',
        hour: hours,
        minute: minutes,
        repeats: true
      } as Notifications.DailyTriggerInput,
    });
  };

  const handleToggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value);
    saveSettings(value, notificationTime);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    const currentDate = selectedTime || notificationTime;
    setShowTimePicker(false);
    
    if (selectedTime) {
      setNotificationTime(currentDate);
      saveSettings(notificationsEnabled, currentDate);
    }
  };

  const resetData = async () => {
    try {
      await AsyncStorage.removeItem('moodData');
      Alert.alert(
        'Données réinitialisées',
        'Toutes les données ont été supprimées avec succès.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/')
          }
        ]
      );
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la réinitialisation des données.');
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Réinitialiser les données',
      'Êtes-vous sûr de vouloir supprimer toutes les données ? Cette action est irréversible.',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: resetData
        }
      ]
    );
  };

  const exportData = async () => {
    try {
      const data = await AsyncStorage.getItem('moodData');
      if (!data) {
        Alert.alert('Erreur', 'Aucune donnée à exporter.');
        return;
      }

      await Share.share({
        message: data,
        title: 'Données d\'humeur',
      });
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'exportation des données.');
    }
  };

  const importData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
      });

      if (result.canceled) {
        return;
      }

      const response = await fetch(result.assets[0].uri);
      const content = await response.text();

      try {
        JSON.parse(content); // Validate JSON
        await AsyncStorage.setItem('moodData', content);
        Alert.alert(
          'Succès',
          'Les données ont été importées avec succès.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/')
            }
          ]
        );
      } catch {
        Alert.alert('Erreur', 'Le fichier sélectionné n\'est pas valide.');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'importation des données.');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeIn.duration(800)}
        style={styles.header}
      >
        <Text style={styles.title}>Paramètres</Text>
      </Animated.View>

      <Animated.View 
        entering={SlideInRight.delay(200).duration(500)}
        style={styles.section}
      >
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Rappel quotidien</Text>
            <Text style={styles.settingDescription}>
              Recevez une notification pour suivre votre humeur
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#e0e0e0', true: '#000' }}
            thumbColor={'#fff'}
            ios_backgroundColor="#e0e0e0"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.timeSelector,
            !notificationsEnabled && styles.disabled
          ]}
          onPress={() => setShowTimePicker(true)}
          disabled={!notificationsEnabled}
        >
          <View style={styles.timeSelectorContent}>
            <Ionicons name="time-outline" size={24} color="#000" />
            <View style={styles.timeTextContainer}>
              <Text style={styles.timeLabel}>Heure de notification</Text>
              <Text style={styles.timeValue}>
                {format(notificationTime, 'HH:mm')}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#000" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View 
        entering={SlideInRight.delay(400).duration(500)}
        style={styles.section}
      >
        <TouchableOpacity
          style={styles.actionButton}
          onPress={exportData}
        >
          <View style={styles.actionButtonContent}>
            <Ionicons name="arrow-down-outline" size={24} color="#007AFF" />
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionLabel, { color: '#007AFF' }]}>Exporter les données</Text>
              <Text style={styles.actionDescription}>
                Sauvegarder vos données dans un fichier
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#007AFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={importData}
        >
          <View style={styles.actionButtonContent}>
            <Ionicons name="arrow-up-outline" size={24} color="#007AFF" />
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionLabel, { color: '#007AFF' }]}>Importer les données</Text>
              <Text style={styles.actionDescription}>
                Restaurer vos données depuis un fichier
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#007AFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetData}
        >
          <View style={styles.resetButtonContent}>
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            <View style={styles.resetTextContainer}>
              <Text style={styles.resetLabel}>Réinitialiser les données</Text>
              <Text style={styles.resetDescription}>
                Supprimer toutes les données enregistrées
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </Animated.View>

      {showTimePicker && (
        <DateTimePicker
          value={notificationTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000',
  },
  section: {
    paddingHorizontal: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 20,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeTextContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 15,
    color: '#666',
  },
  disabled: {
    opacity: 0.5,
  },
  resetButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resetButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resetTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  resetLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 4,
  },
  resetDescription: {
    fontSize: 15,
    color: '#666',
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  actionLabel: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 15,
    color: '#666',
  },
});