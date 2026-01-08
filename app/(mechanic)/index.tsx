import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import apiService from '../../services/apiService';
import authService from '../../services/authService';
import { Screen } from '../../components/ui/Screen';
import { InspectionListItem } from '../../components/mechanic/InspectionListItem';
import { Inspection } from '../../types';

export default function MechanicInspectionsScreen() {
  const router = useRouter();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mechanicId, setMechanicId] = useState<string | null>(null);

  const loadMechanicProfile = async () => {
    try {
      const user = await authService.getUser();
      if (!user) {
        Alert.alert('Error', 'Debes iniciar sesión');
        return null;
      }

      // Buscar el perfil de mecánico asociado al usuario
      // Nota: Esto asume que existe un endpoint o forma de obtener el ID del mecánico
      // Si no, habría que ajustar la lógica según el backend
      // const mechanicData = await apiService.get(`/mechanics/by-user/${user.id}`);
      
      // if (mechanicData) {
      //   setMechanicId(mechanicData.id);
      //   return mechanicData.id;
      // } else {
      
      // Para simplificar, asumimos que el ID del usuario es el ID del mecánico
      // ya que en la tabla de usuarios el rol es 'Mecánico'
      setMechanicId(user.id);
      return user.id;

      //   Alert.alert(
      //     'No eres mecánico',
      //     'No se encontró un perfil de mecánico asociado a tu cuenta.',
      //     [{ text: 'OK' }]
      //   );
      //   return null;
      // }
    } catch (error: any) {
      console.error('Error al cargar perfil de mecánico:', error);
      // Alert.alert('Error', error.message || 'No se pudo cargar el perfil');
      return null;
    }
  };

  const loadInspections = async () => {
    try {
      setLoading(true);
      let currentMechanicId = mechanicId;
      
      if (!currentMechanicId) {
        currentMechanicId = await loadMechanicProfile();
      }

      if (currentMechanicId) {
        const data = await apiService.get(`/inspections/mechanic/${currentMechanicId}`);
        setInspections(data || []);
      }
    } catch (error: any) {
      console.error('Error loading inspections:', error);
      Alert.alert('Error', error.message || 'No se pudieron cargar las inspecciones');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInspections();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInspections();
    setRefreshing(false);
  };

  const handleInspectionPress = (inspection: Inspection) => {
    router.push({
      pathname: '/(mechanic)/inspection-detail',
      params: { id: inspection.id }
    });
  };

  return (
    <Screen style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
        </View>
      ) : (
        <FlatList
          data={inspections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <InspectionListItem
              inspection={item}
              onPress={() => handleInspectionPress(item)}
              onViewResult={() => {
                router.push({
                  pathname: '/user-inspection-detail',
                  params: { id: item.id }
                });
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF9800']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tienes inspecciones asignadas</Text>
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
