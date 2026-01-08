import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import adminService from '../../services/adminService';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { useFocusEffect } from '@react-navigation/native';

const DAYS = [
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' },
];

export default function AdminMechanicScheduleScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams();
  const mechanicId = Array.isArray(id) ? id[0] : id;
  const mechanicName = Array.isArray(name) ? name[0] : name;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [schedules, setSchedules] = useState<Record<number, string[]>>({});
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  // Initialize empty schedule
  const initializeSchedule = () => {
    const initialSchedule: Record<number, string[]> = {};
    DAYS.forEach(day => {
      initialSchedule[day.id] = [];
    });
    setSchedules(initialSchedule);
  };

  const loadTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    setTimeSlots(slots);
  };

  const loadSchedule = async () => {
    if (!mechanicId) return;
    try {
      const data = await adminService.getMechanicSchedule(mechanicId);
      const scheduleMap: Record<number, string[]> = {};
      
      DAYS.forEach(day => {
        scheduleMap[day.id] = [];
      });

      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          if (item.isActive) {
            scheduleMap[item.dayOfWeek] = item.timeSlots || [];
          }
        });
      }

      setSchedules(scheduleMap);
    } catch (error) {
      console.error('Error loading schedule:', error);
      Alert.alert('Error', 'No se pudo cargar el horario');
    }
  };

  const init = async () => {
    setLoading(true);
    initializeSchedule();
    loadTimeSlots();
    await loadSchedule();
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      init();
    }, [mechanicId])
  );

  const toggleSlot = (time: string) => {
    setSchedules(prev => {
      const currentSlots = prev[selectedDay] || [];
      const newSlots = currentSlots.includes(time)
        ? currentSlots.filter(t => t !== time)
        : [...currentSlots, time].sort();
      
      return {
        ...prev,
        [selectedDay]: newSlots
      };
    });
  };

  const handleSave = async () => {
    if (!mechanicId) return;

    try {
      setSaving(true);
      
      const scheduleArray = Object.entries(schedules).map(([day, slots]) => ({
        dayOfWeek: parseInt(day),
        timeSlots: slots,
        isActive: slots.length > 0
      }));

      await adminService.updateMechanicSchedule(mechanicId, { schedules: scheduleArray });
      Alert.alert('Éxito', 'Horario actualizado correctamente', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', error.message || 'No se pudo guardar el horario');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Horario: {mechanicName || 'Mecánico'}</Text>
      </View>

      <View style={styles.daysContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {DAYS.map(day => (
            <TouchableOpacity
              key={day.id}
              style={[
                styles.dayButton,
                selectedDay === day.id && styles.selectedDayButton
              ]}
              onPress={() => setSelectedDay(day.id)}
            >
              <Text style={[
                styles.dayText,
                selectedDay === day.id && styles.selectedDayText
              ]}>
                {day.name}
              </Text>
              {schedules[day.id]?.length > 0 && (
                <View style={styles.dot} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.slotsContainer}>
        <Text style={styles.sectionTitle}>
          {DAYS.find(d => d.id === selectedDay)?.name}
        </Text>
        <Text style={styles.subtitle}>Selecciona las horas disponibles</Text>

        <View style={styles.grid}>
          {timeSlots.map(time => {
            const isSelected = schedules[selectedDay]?.includes(time);
            return (
              <TouchableOpacity
                key={time}
                style={[
                  styles.slot,
                  isSelected && styles.selectedSlot
                ]}
                onPress={() => toggleSlot(time)}
              >
                <Text style={[
                  styles.slotText,
                  isSelected && styles.selectedSlotText
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Guardar Cambios"
          onPress={handleSave}
          loading={saving}
          style={styles.saveButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  daysContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  selectedDayButton: {
    backgroundColor: '#007bff',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  selectedDayText: {
    color: '#FFF',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#28a745',
    marginTop: 4,
  },
  slotsContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slot: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  selectedSlot: {
    backgroundColor: '#e7f1ff',
    borderColor: '#007bff',
  },
  slotText: {
    fontSize: 14,
    color: '#333',
  },
  selectedSlotText: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  saveButton: {
    backgroundColor: '#007bff',
  },
});
