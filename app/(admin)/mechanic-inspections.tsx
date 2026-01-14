import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import adminService, { AdminInspection } from '../../services/adminService';
import { InspectionCard } from '../../components/admin/InspectionCard';

export default function MechanicInspectionsScreen() {
  const { mechanicId, mechanicName } = useLocalSearchParams();
  const router = useRouter();
  const [inspections, setInspections] = useState<AdminInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInspections = async () => {
    try {
      if (!mechanicId) return;
      setLoading(true);
      const data = await adminService.getMechanicInspections(mechanicId as string);
      
      // Map data if needed, similar to AdminInspectionsScreen
      // reusing mapping logic if getMechanicInspections returns raw data
      // For now assuming it returns consistent AdminInspection structure or we adopt to it.
      // Based on mechanics.tsx usage: it returns any[].
      
      const mapStatus = (status: string) => {
        if (!status) return 'pending';
        const s = status.toLowerCase();
        if (s === 'pendiente') return 'pending';
        if (s === 'confirmada') return 'scheduled';
        if (s === 'finalizada') return 'completed';
        if (s === 'rechazada' || s === 'cancelada') return 'cancelled';
        return s;
      };

      const mappedData = (data as any[]).map((item: any) => ({
        id: item.id,
        inspectionNumber: item.inspectionNumber || `INS-${item.id?.slice(0, 8)}`,
        vehicleId: item.vehicleId || item.vehicle?.id || item.publicacion?.vehiculo?.id,
        vehiclePatent: item.vehicle?.patent || item.vehiclePatent || item.publicacion?.vehiculo?.patente,
        vehicleBrand: item.vehicle?.brand || item.vehicleBrand || item.publicacion?.vehiculo?.marca || null,
        vehicleModel: item.vehicle?.model || item.vehicleModel || item.publicacion?.vehiculo?.modelo || null,
        mechanicId: item.mechanicId || item.mechanic?.id,
        mechanicName: item.mechanicName || (item.mechanic 
          ? (`${item.mechanic.primerNombre || item.mechanic.firstName || ''} ${item.mechanic.primerApellido || item.mechanic.lastName || ''}`.trim() || item.mechanic.email || 'Mecánico')
          : null),
        mechanicPhoto: item.mechanicPhoto || item.mechanic?.foto_url || item.mechanic?.profilePhoto || null,
        status: mapStatus(item.estado_insp || item.status),
        scheduledDate: item.fechaProgramada || item.scheduledDate || item.fechaCreacion || item.createdAt,
        price: item.valor || item.price || 0,
        paymentStatus: item.estado_pago || item.paymentStatus || 'pending',
        createdAt: item.fechaCreacion || item.createdAt,
        updatedAt: item.updatedAt,
        cancellationReason: item.cancellationReason,
        observacion: item.observacion,
      }));

      setInspections(mappedData);
    } catch (error) {
      console.error('Error loading mechanic inspections:', error);
      Alert.alert('Error', 'No se pudieron cargar las inspecciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInspections();
  }, [mechanicId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInspections();
    setRefreshing(false);
  };

  // We can reuse logic for viewing detail if needed, currently InspectionCard has basic info
  // If we want to view full details we might need to navigate to AdminInspectionsScreen
  // with highlightId, or a detail screen.
  const handleInspectionPress = (inspection: AdminInspection) => {
     // Navigate to main inspections list highlighting this one?
     // Or maybe open a modal?
     // For simplicity and reusing existing screens:
     router.push({
        pathname: '/(admin)/inspections',
        params: { highlightId: inspection.id }
     });
  };

  return (
    <Screen style={styles.container} backgroundColor="#fff">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Inspecciones</Text>
          <Text style={styles.headerSubtitle}>{mechanicName || 'Mecánico'}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
          <FlatList
            data={inspections}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <InspectionCard 
                inspection={item} 
                onPress={() => handleInspectionPress(item)}
                showMechanic={false} // We know the mechanic
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="clipboard-outline" size={48} color="#CCC" />
                <Text style={styles.emptyText}>Este mecánico no tiene inspecciones asignadas.</Text>
              </View>
            }
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 12, color: '#666' },
  backButton: { padding: 4 },
  listContent: { padding: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { marginTop: 12, fontSize: 16, color: '#666' },
});
