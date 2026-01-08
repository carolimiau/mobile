import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import adminService, { Mechanic } from '../../services/adminService';
import { Screen } from '../../components/ui/Screen';
import { MechanicCard } from '../../components/admin/MechanicCard';
import { Button } from '../../components/ui/Button';

export default function AdminMechanicsScreen() {
  const router = useRouter();
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedMechanicId, setExpandedMechanicId] = useState<string | null>(null);
  const [mechanicInspections, setMechanicInspections] = useState<{[key: string]: any[]}>({});
  const [loadingInspections, setLoadingInspections] = useState<{[key: string]: boolean}>({});

  const loadMechanics = async () => {
    try {
      setLoading(true);
      const mechanicsData = await adminService.getMechanics();
      setMechanics(mechanicsData);
    } catch (error: any) {
      console.error('Error loading mechanics:', error);
      Alert.alert('Error', error.message || 'No se pudieron cargar los mecánicos');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMechanics();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMechanics();
    setRefreshing(false);
  };

  const handleCreateMechanic = () => {
    router.push('/(admin)/create-mechanic');
  };

  const handleMechanicPress = (mechanic: Mechanic) => {
    // Navigate to details or edit?
    // For now, maybe just expand
    toggleMechanicInspections(mechanic.id);
  };

  const handleSchedulePress = (mechanic: Mechanic) => {
    router.push({
      pathname: '/(admin)/mechanic-schedule',
      params: { 
        id: mechanic.id, 
        name: `${mechanic.firstName} ${mechanic.lastName}` 
      }
    });
  };

  const handlePaymentPress = (mechanic: Mechanic) => {
    // Open payment modal (to be implemented)
    Alert.alert('Pago', 'Funcionalidad en desarrollo');
  };

  const toggleMechanicInspections = async (mechanicId: string) => {
    if (expandedMechanicId === mechanicId) {
      setExpandedMechanicId(null);
      return;
    }

    setExpandedMechanicId(mechanicId);
    
    // Load inspections if not already loaded
    if (!mechanicInspections[mechanicId]) {
      setLoadingInspections(prev => ({ ...prev, [mechanicId]: true }));
      try {
        const inspections = await adminService.getMechanicInspections(mechanicId);
        setMechanicInspections(prev => ({ ...prev, [mechanicId]: inspections }));
      } catch (error) {
        console.error('Error loading mechanic inspections:', error);
        Alert.alert('Error', 'No se pudieron cargar las inspecciones del mecánico');
      } finally {
        setLoadingInspections(prev => ({ ...prev, [mechanicId]: false }));
      }
    }
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mecánicos</Text>
        <Button 
          title="Nuevo Mecánico" 
          onPress={handleCreateMechanic}
          size="small"
          icon={<Ionicons name="add" size={20} color="#FFF" />}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <FlatList
          data={mechanics}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MechanicCard
              mechanic={item}
              onPress={() => handleMechanicPress(item)}
              onSchedulePress={() => handleSchedulePress(item)}
              onPaymentPress={() => handlePaymentPress(item)}
              onToggleInspections={() => toggleMechanicInspections(item.id)}
              isExpanded={expandedMechanicId === item.id}
              inspections={mechanicInspections[item.id]}
              loadingInspections={loadingInspections[item.id]}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay mecánicos registrados</Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
