import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import apiService from '../../services/apiService';
import authService from '../../services/authService';
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
  { id: 7, name: 'Domingo' },
];

export default function MechanicScheduleScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mechanicId, setMechanicId] = useState<string | null>(null);
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

  const [sedeSchedules, setSedeSchedules] = useState<Record<number, string[]>>({});

  const loadSedeSchedule = async () => {
    try {
      console.log('Loading sede schedule...');
      const data = await apiService.get('/mechanics/sede-schedule/1');
      console.log('Sede schedule loaded:', data ? 'success' : 'empty');
      const scheduleMap: Record<number, string[]> = {};
      
      DAYS.forEach(day => {
        scheduleMap[day.id] = [];
      });

      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          if (item.isActive) {
            const existing = scheduleMap[item.dayOfWeek] || [];
            scheduleMap[item.dayOfWeek] = [...existing, ...(item.timeSlots || [])].sort();
          }
        });
      }

      setSedeSchedules(scheduleMap);
      return scheduleMap;
    } catch (error) {
      console.error('Error loading sede schedule:', error);
      return null;
    }
  };

  const loadMechanicProfile = async () => {
    try {
      const user = await authService.getUser();
      if (!user) {
        Alert.alert('Error', 'Debes iniciar sesión');
        return null;
      }

      const mechanicData = await apiService.get(`/mechanics/by-user/${user.id}`);
      if (mechanicData) {
        setMechanicId(mechanicData.id);
        return mechanicData.id;
      }
      return null;
    } catch (error) {
      console.error('Error loading mechanic profile:', error);
      return null;
    }
  };

  const loadSchedule = async (id: string) => {
    try {
      console.log('Loading mechanic schedule for:', id);
      const data = await apiService.get(`/mechanics/${id}/schedule`);
      console.log('Mechanic schedule loaded:', data ? 'success' : 'empty');
      const scheduleMap: Record<number, string[]> = {};
      
      DAYS.forEach(day => {
        scheduleMap[day.id] = [];
      });

      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          if (item.isActive) {
            const existing = scheduleMap[item.dayOfWeek] || [];
            scheduleMap[item.dayOfWeek] = [...existing, ...(item.timeSlots || [])].sort();
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
    
    const sedeMap = await loadSedeSchedule();
    
    const id = await loadMechanicProfile();
    if (id) {
      await loadSchedule(id);
    }

    if (sedeMap) {
      setTimeSlots(sedeMap[selectedDay] || []);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    const sedeSlots = sedeSchedules[selectedDay] || [];
    const userSlots = schedules[selectedDay] || [];
    
    // Combine and sort unique slots to ensure user's saved slots are visible
    // even if they differ from the current Sede schedule
    const allSlots = Array.from(new Set([...sedeSlots, ...userSlots])).sort();
    
    setTimeSlots(allSlots);
  }, [selectedDay, sedeSchedules, schedules]);

  useFocusEffect(
    useCallback(() => {
      init();
    }, [])
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
      
      // Convert map to array for API
      const scheduleArray = Object.entries(schedules).map(([day, slots]) => ({
        dayOfWeek: parseInt(day),
        timeSlots: slots,
        isActive: slots.length > 0
      }));

      await apiService.put(`/mechanics/${mechanicId}/schedule`, { schedules: scheduleArray });
      Alert.alert('Éxito', 'Horario actualizado correctamente');
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
        <ActivityIndicator size="large" color="#FF9800" />
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
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
          Horario para {DAYS.find(d => d.id === selectedDay)?.name}
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
          title="Guardar Horario"
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
    backgroundColor: '#FF9800',
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
    backgroundColor: '#4CAF50',
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
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  slotText: {
    fontSize: 14,
    color: '#333',
  },
  selectedSlotText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  saveButton: {
    backgroundColor: '#FF9800',
  },
});
