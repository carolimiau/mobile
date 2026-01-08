import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, router } from 'expo-router';
import adminService, { AdminInspection, Mechanic } from '../../services/adminService';
import apiService from '../../services/apiService';
import { Screen } from '../../components/ui/Screen';
import { InspectionCard } from '../../components/admin/InspectionCard';

const { width } = Dimensions.get('window');

export default function AdminInspectionsScreen() {
  const { highlightId } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);
  const [inspections, setInspections] = useState<AdminInspection[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Details Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailInspection, setDetailInspection] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [filteredMechanics, setFilteredMechanics] = useState<Mechanic[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<AdminInspection | null>(null);
  const [selectedMechanicId, setSelectedMechanicId] = useState<string>('');
  const [searchingMechanics, setSearchingMechanics] = useState(false);
  const [mechanicSearch, setMechanicSearch] = useState('');
  const [mechanicSortOption, setMechanicSortOption] = useState<'availability' | 'rating' | 'completed' | 'pending'>('availability');

  useEffect(() => {
    if (highlightId && inspections.length > 0) {
      const index = inspections.findIndex(i => i.id === highlightId);
      if (index !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0 });
        }, 500);
      }
    }
  }, [highlightId, inspections]);

  const loadInspections = async () => {
    try {
      setLoading(true);
      const data = await adminService.getInspections();
      console.log('🔍 [AdminInspections] Loaded', data.length, 'inspections');
      if (data.length > 0) {
        console.log('🔍 [AdminInspections] First item mechanic:', JSON.stringify(data[0].mechanic, null, 2));
        console.log('🔍 [AdminInspections] First item mechanicId:', data[0].mechanicId);
      }

      const mapStatus = (status: string) => {
        if (!status) return 'pending';
        const s = status.toLowerCase();
        if (s === 'pendiente') return 'pending';
        if (s === 'confirmada') return 'scheduled';
        if (s === 'finalizada') return 'completed';
        if (s === 'rechazada' || s === 'cancelada') return 'cancelled';
        return s;
      };

      const mappedData = data.map((item: any) => ({
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

  const handleAssignMechanic = async (inspection: AdminInspection) => {
    setSelectedInspection(inspection);
    setSelectedMechanicId(inspection.mechanicId || '');
    setMechanicSearch('');
    setMechanicSortOption('availability');
    setShowAssignModal(true);
    setSearchingMechanics(true);

    try {
      let dateStr, timeStr;
      // Prioritize fechaProgramada if exists, else scheduledDate
      const dateVal = inspection.scheduledDate; // In mobile mappedData, scheduledDate holds the date
      
      if (dateVal) {
        const d = new Date(dateVal);
        // Send Local Date YYYY-MM-DD
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
        
        // Extract time HH:mm
        timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        
        console.log(`🔍 Buscando mecánicos disponibles para: ${dateStr} ${timeStr}`);
      }

      // Fetch from backend with filter
      const availableMechanics = await adminService.getAllMechanics('', dateStr, timeStr);
      console.log(`✅ Mecánicos encontrados: ${availableMechanics.length}`);
      setMechanics(availableMechanics); // Store all fetched
      setFilteredMechanics(availableMechanics); // Initial filter
    } catch (error) {
      console.error('Error fetching available mechanics:', error);
      Alert.alert('Error', 'No se pudieron cargar los mecánicos disponibles');
      setFilteredMechanics([]);
    } finally {
      setSearchingMechanics(false);
    }
  };

  const handleMechanicSearch = (text: string) => {
    setMechanicSearch(text);
    if (text.trim() === '') {
      setFilteredMechanics(mechanics);
    } else {
      const lower = text.toLowerCase();
      const filtered = mechanics.filter(m => 
        m.firstName.toLowerCase().includes(lower) || 
        m.lastName.toLowerCase().includes(lower) ||
        m.email.toLowerCase().includes(lower) ||
        (m.specialization && m.specialization.toLowerCase().includes(lower))
      );
      setFilteredMechanics(filtered);
    }
  };

  const confirmAssignMechanic = async () => {
    if (!selectedInspection || !selectedMechanicId) {
      Alert.alert('Error', 'Selecciona un mecánico');
      return;
    }

    try {
      setLoading(true);
      // Call backend to assign (creates request)
      // Note: adminService.assignInspectionToMechanic might not exist in mobile service yet, checking...
      // It seems mobile adminService doesn't have assignInspectionToMechanic based on previous read.
      // I'll use apiService directly or add it to adminService.
      // Let's check apiService or use a direct fetch if needed.
      // Actually, let's assume we need to add it or use a generic post.
      
      // Using apiService to post to the endpoint
      await apiService.patch(`/inspections/${selectedInspection.id}/assign-mechanic`, { mechanicId: selectedMechanicId });
      
      Alert.alert('Solicitud Enviada', 'Se ha enviado una solicitud al mecánico. La inspección se asignará cuando acepte.');
      setShowAssignModal(false);
      loadInspections(); 
    } catch (error: any) {
      console.error('Error al asignar mecánico:', error);
      Alert.alert('Error', error.message || 'No se pudo asignar el mecánico');
    } finally {
      setLoading(false);
    }
  };

  const handleInspectionPress = async (inspection: AdminInspection) => {
    setShowDetailModal(true);
    setLoadingDetails(true);
    setDetailInspection(null);
    try {
      const details = await adminService.getInspectionById(inspection.id);
      console.log('🔍 [AdminInspections] Details loaded:', JSON.stringify(details, null, 2));
      if (details.publicacion) {
        console.log('📸 [AdminInspections] Photos:', details.publicacion.fotos);
      } else {
        console.log('⚠️ [AdminInspections] No publication found for this inspection');
      }
      setDetailInspection(details);
    } catch (error) {
      console.error('Error fetching details:', error);
      Alert.alert('Error', 'No se pudieron cargar los detalles de la inspección');
      setShowDetailModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inspecciones</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={inspections}
          keyExtractor={(item) => item.id}
          onScrollToIndexFailed={(info) => {
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
            });
          }}
          renderItem={({ item }) => (
            <InspectionCard
              inspection={item}
              onPress={() => handleInspectionPress(item)}
              onAssignPress={() => handleAssignMechanic(item)}
              onViewResult={() => {
                router.push({
                  pathname: '/user-inspection-detail',
                  params: { id: item.id }
                });
              }}
              style={item.id === highlightId ? styles.highlightedCard : undefined}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No hay inspecciones registradas
              </Text>
            </View>
          }
        />
      )}

      {/* Details Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles de Inspección</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            {loadingDetails ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
              </View>
            ) : detailInspection ? (
              <ScrollView style={styles.modalBody}>
                {/* Vehicle Photos */}
                {detailInspection.publicacion?.fotos && detailInspection.publicacion.fotos.length > 0 ? (
                  <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
                    {detailInspection.publicacion.fotos.map((foto: any, index: number) => (
                      <Image key={index} source={{ uri: foto.url }} style={styles.vehiclePhoto} resizeMode="cover" />
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.noPhotosContainer}>
                    <Ionicons name="image-outline" size={48} color="#CCC" />
                    <Text style={styles.noPhotosText}>Sin fotos del vehículo</Text>
                  </View>
                )}

                {/* Vehicle Info */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Vehículo</Text>
                  <Text style={styles.detailLabel}>Patente: <Text style={styles.detailValue}>{detailInspection.publicacion?.vehiculo?.patente || 'N/A'}</Text></Text>
                  <Text style={styles.detailLabel}>Marca: <Text style={styles.detailValue}>{detailInspection.publicacion?.vehiculo?.marca || 'N/A'}</Text></Text>
                  <Text style={styles.detailLabel}>Modelo: <Text style={styles.detailValue}>{detailInspection.publicacion?.vehiculo?.modelo || 'N/A'}</Text></Text>
                  <Text style={styles.detailLabel}>Año: <Text style={styles.detailValue}>{detailInspection.publicacion?.vehiculo?.anio || 'N/A'}</Text></Text>
                </View>

                {/* Publication Info */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Publicación</Text>
                  <Text style={styles.detailLabel}>Precio: <Text style={styles.detailValue}>${detailInspection.publicacion?.valor?.toLocaleString('es-CL') || 0}</Text></Text>
                  <Text style={styles.detailLabel}>Descripción: <Text style={styles.detailValue}>{detailInspection.publicacion?.descripcion || 'Sin descripción'}</Text></Text>
                  
                  {/* Publication Payment Info */}
                  {detailInspection.publicacion?.paymentDetails && detailInspection.publicacion.paymentDetails.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={[styles.detailLabel, { fontWeight: 'bold' }]}>Pago de Publicación:</Text>
                      {detailInspection.publicacion.paymentDetails.map((detail: any, index: number) => (
                        <View key={index} style={styles.paymentCard}>
                          <Text style={styles.paymentAmount}>Monto: ${detail.monto?.toLocaleString('es-CL')}</Text>
                          <Text style={styles.paymentStatus}>Estado: {detail.pago?.estado || 'Desconocido'}</Text>
                          <Text style={styles.paymentMethod}>Método: {detail.pago?.metodo || 'N/A'}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Seller Info */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Vendedor (Solicitante)</Text>
                  <View style={styles.sellerInfo}>
                    {detailInspection.publicacion?.vendedor?.foto_url ? (
                      <Image source={{ uri: detailInspection.publicacion.vendedor.foto_url }} style={styles.sellerPhoto} />
                    ) : (
                      <View style={styles.sellerPhotoPlaceholder}>
                        <Ionicons name="person" size={24} color="#FFF" />
                      </View>
                    )}
                    <View>
                      <Text style={styles.sellerName}>
                        {detailInspection.publicacion?.vendedor?.primerNombre} {detailInspection.publicacion?.vendedor?.primerApellido}
                      </Text>
                      <Text style={styles.sellerEmail}>{detailInspection.publicacion?.vendedor?.email}</Text>
                      <Text style={styles.sellerPhone}>{detailInspection.publicacion?.vendedor?.telefono || 'Sin teléfono'}</Text>
                    </View>
                  </View>
                </View>

                {/* Payment Info */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Pago de Inspección</Text>
                  {detailInspection.paymentDetails && detailInspection.paymentDetails.length > 0 ? (
                    detailInspection.paymentDetails.map((detail: any, index: number) => (
                      <View key={index} style={styles.paymentCard}>
                        <Text style={styles.paymentAmount}>Monto: ${detail.monto?.toLocaleString('es-CL')}</Text>
                        <Text style={styles.paymentStatus}>Estado: {detail.pago?.estado || 'Desconocido'}</Text>
                        <Text style={styles.paymentDate}>Fecha: {new Date(detail.pago?.fechaCreacion).toLocaleDateString('es-CL')}</Text>
                        <Text style={styles.paymentMethod}>Método: {detail.pago?.metodo || 'N/A'}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noPaymentText}>No hay detalles de pago registrados</Text>
                  )}
                </View>

                {/* View Questionnaire Button */}
                <TouchableOpacity 
                  style={styles.viewQuestionnaireButton}
                  onPress={() => {
                    setShowDetailModal(false);
                    router.push({
                      pathname: '/user-inspection-detail',
                      params: { id: detailInspection.id }
                    });
                  }}
                >
                  <Ionicons name="clipboard-outline" size={20} color="#FFF" />
                  <Text style={styles.viewQuestionnaireText}>Ver Cuestionario</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>No se pudo cargar la información</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Assignment Modal */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Asignar Mecánico</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedInspection && (
                <View style={styles.inspectionSummary}>
                  <Text style={styles.summaryText}>
                    Inspección: #{selectedInspection.inspectionNumber}
                  </Text>
                  <Text style={styles.summaryText}>
                    Vehículo: {selectedInspection.vehicleBrand} {selectedInspection.vehicleModel}
                  </Text>
                </View>
              )}

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar mecánico..."
                  value={mechanicSearch}
                  onChangeText={handleMechanicSearch}
                  autoCapitalize="none"
                />
                {mechanicSearch.length > 0 && (
                  <TouchableOpacity onPress={() => handleMechanicSearch('')}>
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>

              {searchingMechanics ? (
                <View style={styles.searchingContainer}>
                  <ActivityIndicator size="small" color="#4CAF50" />
                  <Text style={styles.searchingText}>Buscando disponibles...</Text>
                </View>
              ) : (
                <ScrollView style={styles.mechanicsList}>
                  {filteredMechanics.length === 0 ? (
                    <View style={styles.noResults}>
                      <Ionicons name="person-outline" size={48} color="#CCC" />
                      <Text style={styles.noResultsText}>
                        {mechanicSearch ? 'No se encontraron mecánicos' : 'No hay mecánicos disponibles para este horario'}
                      </Text>
                    </View>
                  ) : (
                    filteredMechanics.map((mechanic) => (
                      <TouchableOpacity
                        key={mechanic.id}
                        style={[
                          styles.mechanicCard,
                          selectedMechanicId === mechanic.id && styles.mechanicCardSelected
                        ]}
                        onPress={() => setSelectedMechanicId(mechanic.id)}
                      >
                        <View style={styles.mechanicCardHeader}>
                          <View style={styles.mechanicCardInfo}>
                            <Text style={styles.mechanicCardName}>
                              {mechanic.firstName} {mechanic.lastName}
                            </Text>
                            <Text style={styles.mechanicCardEmail}>{mechanic.email}</Text>
                            {mechanic.specialization && (
                              <Text style={styles.mechanicCardSpec}>
                                📋 {mechanic.specialization}
                              </Text>
                            )}
                          </View>
                          {selectedMechanicId === mechanic.id && (
                            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              )}

              <TouchableOpacity
                style={[styles.confirmButton, !selectedMechanicId && styles.confirmButtonDisabled]}
                onPress={confirmAssignMechanic}
                disabled={!selectedMechanicId}
              >
                <Text style={styles.confirmButtonText}>Confirmar Asignación</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  highlightedCard: {
    borderColor: '#2196F3',
    borderWidth: 2,
    backgroundColor: '#E3F2FD',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
    flex: 1,
  },
  inspectionSummary: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  searchingText: {
    fontSize: 14,
    color: '#666',
  },
  mechanicsList: {
    flex: 1,
    marginBottom: 16,
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  mechanicCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  mechanicCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8F4',
  },
  mechanicCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  mechanicCardInfo: {
    flex: 1,
  },
  mechanicCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  mechanicCardEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  mechanicCardSpec: {
    fontSize: 12,
    color: '#4CAF50',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCC',
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photosContainer: {
    height: 200,
    marginBottom: 16,
  },
  vehiclePhoto: {
    width: width - 40, // Modal padding is 20
    height: 200,
    borderRadius: 8,
    marginRight: 10,
  },
  noPhotosContainer: {
    height: 150,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 16,
  },
  noPhotosText: {
    color: '#999',
    marginTop: 8,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    color: '#333',
    fontWeight: '500',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  sellerPhotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sellerEmail: {
    fontSize: 14,
    color: '#666',
  },
  sellerPhone: {
    fontSize: 14,
    color: '#666',
  },
  paymentCard: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  paymentStatus: {
    fontSize: 14,
    color: '#333',
  },
  viewQuestionnaireButton: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    gap: 10,
  },
  viewQuestionnaireText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentDate: {
    fontSize: 12,
    color: '#666',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#666',
  },
  noPaymentText: {
    fontStyle: 'italic',
    color: '#999',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});
