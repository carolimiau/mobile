import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import paymentService from '../../services/paymentService';
import adminService, { Sede } from '../../services/adminService';
import { MechanicPayment } from '../../types/index';
import { getImageUrl } from '../../utils/imageUtils';

type FilterStatus = 'all' | 'pendiente' | 'pagado' | 'rechazado';

const STATUS_FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'pagado', label: 'Pagado' },
  { key: 'rechazado', label: 'Rechazado' },
];

function getStatusColor(estado?: string): string {
  if (!estado) return '#4CAF50';
  const s = estado.toUpperCase();
  if (s.includes('PEND')) return '#FF9800';
  if (s.includes('RECHAZO') || s.includes('RECHAZ') || s.includes('REJECT') || s.includes('FAIL')) return '#F44336';
  if (s.includes('PAG') || s.includes('COMPLET') || s.includes('AUTHORIZ')) return '#4CAF50';
  return '#4CAF50';
}

function getStatusLabel(estado?: string): string {
  if (!estado) return 'Pagado';
  const s = estado.toUpperCase();
  if (s.includes('PEND')) return 'Pendiente';
  if (s.includes('RECHAZO') || s.includes('RECHAZ') || s.includes('REJECT') || s.includes('FAIL')) return 'Rechazado';
  if (s.includes('PAG') || s.includes('COMPLET') || s.includes('AUTHORIZ')) return 'Pagado';
  return estado;
}

function matchesFilter(item: MechanicPayment, filter: FilterStatus): boolean {
  if (filter === 'all') return true;
  const s = (item.estado || '').toUpperCase();
  if (filter === 'pendiente') return s.includes('PEND');
  if (filter === 'rechazado') return s.includes('RECHAZO') || s.includes('RECHAZ') || s.includes('REJECT') || s.includes('FAIL');
  if (filter === 'pagado') return !s || s.includes('PAG') || s.includes('COMPLET') || s.includes('AUTHORIZ');
  return true;
}

export default function AllMechanicPaymentsScreen() {
  const [allPayments, setAllPayments] = useState<MechanicPayment[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      // Cargar sedes y pagos en paralelo
      const [sedesData, paymentsData] = await Promise.all([
        adminService.getSedes().catch(() => [] as Sede[]),
        paymentService.getAllMechanicPayouts(selectedSedeId ?? undefined),
      ]);
      setSedes(sedesData);
      setAllPayments(paymentsData || []);
    } catch (error) {
      console.error('Error cargando pagos de mecánicos:', error);
      Alert.alert('Error', 'No se pudieron cargar los pagos de mecánicos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadPayments = async () => {
    try {
      const data = await paymentService.getAllMechanicPayouts(selectedSedeId ?? undefined);
      setAllPayments(data || []);
    } catch (error) {
      console.error('Error cargando pagos:', error);
      Alert.alert('Error', 'No se pudieron cargar los pagos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [])
  );

  // Recargar cuando cambie el filtro de sede
  const handleSedeChange = (sedeId: number | null) => {
    setSelectedSedeId(sedeId);
    setLoading(true);
    paymentService
      .getAllMechanicPayouts(sedeId ?? undefined)
      .then(data => setAllPayments(data || []))
      .catch(() => Alert.alert('Error', 'No se pudieron filtrar los pagos'))
      .finally(() => setLoading(false));
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  const filteredPayments = allPayments.filter(item => matchesFilter(item, selectedFilter));

  const totalPagado = allPayments
    .filter(p => matchesFilter(p, 'pagado'))
    .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

  const totalPendiente = allPayments
    .filter(p => matchesFilter(p, 'pendiente'))
    .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

  const renderPaymentItem = ({ item }: { item: MechanicPayment }) => {
    const isExpanded = expandedId === item.id;
    const statusColor = getStatusColor(item.estado);
    const statusLabel = getStatusLabel(item.estado);
    const mechanicName = item.mechanic
      ? `${item.mechanic.firstName} ${item.mechanic.lastName}`
      : item.mecanico
        ? `${item.mecanico.primerNombre} ${item.mecanico.primerApellido}`
        : null;

    return (
      <View style={styles.paymentCard}>
        <TouchableOpacity
          style={styles.paymentHeader}
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentAmount}>
              {paymentService.formatCurrency(item.monto)}
            </Text>
            {mechanicName ? (
              <Text style={styles.mechanicName}>{mechanicName}</Text>
            ) : null}
            <Text style={styles.paymentDate}>
              {item.fecha_pago
                ? new Date(item.fecha_pago).toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Sin fecha'}
            </Text>
          </View>

          <View style={styles.paymentRight}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
            {item.sede ? (
              <Text style={styles.sedeLabel}>{item.sede.nombre}</Text>
            ) : null}
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#666"
              style={{ marginTop: 4 }}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.paymentDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ID de Pago:</Text>
              <Text style={styles.detailValue}>#{item.id}</Text>
            </View>
            {item.nota ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nota:</Text>
                <Text style={styles.detailValue}>{item.nota}</Text>
              </View>
            ) : null}

            {item.comprobante_url ? (
              <View style={styles.receiptContainer}>
                <Text style={styles.detailLabel}>Comprobante:</Text>
                <TouchableOpacity onPress={() => setSelectedImage(getImageUrl(item.comprobante_url))}>
                  <Image
                    source={{ uri: getImageUrl(item.comprobante_url) }}
                    style={styles.receiptThumbnail}
                  />
                  <View style={styles.zoomOverlay}>
                    <Ionicons name="scan-outline" size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  return (
    <Screen backgroundColor="#F5F5F5">
      {/* Título */}
      <View style={styles.titleBar}>
        <Text style={styles.screenTitle}>Pagos a Mecánicos</Text>
      </View>

      {/* Resumen */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Pagado</Text>
          <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
            {paymentService.formatCurrency(totalPagado)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pendiente</Text>
          <Text style={[styles.summaryValue, { color: '#FF9800' }]}>
            {paymentService.formatCurrency(totalPendiente)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Registros</Text>
          <Text style={styles.summaryValue}>{allPayments.length}</Text>
        </View>
      </View>

      {/* Filtro por Sede */}
      <View style={styles.sectionHeader}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text style={styles.sectionHeaderText}>Filtrar por Sede</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sedeFilterRow}
      >
        <TouchableOpacity
          style={[styles.sedeChip, selectedSedeId === null && styles.sedeChipActive]}
          onPress={() => handleSedeChange(null)}
        >
          <Text style={[styles.sedeChipText, selectedSedeId === null && styles.sedeChipTextActive]}>
            Todas las Sedes
          </Text>
        </TouchableOpacity>
        {sedes.map(sede => (
          <TouchableOpacity
            key={sede.id}
            style={[styles.sedeChip, selectedSedeId === sede.id && styles.sedeChipActive]}
            onPress={() => handleSedeChange(sede.id)}
          >
            <Text style={[styles.sedeChipText, selectedSedeId === sede.id && styles.sedeChipTextActive]}>
              {sede.nombre}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filtros de estado */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.filterChip, selectedFilter === opt.key && styles.filterChipActive]}
            onPress={() => setSelectedFilter(opt.key)}
          >
            <Text style={[styles.filterChipText, selectedFilter === opt.key && styles.filterChipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <FlatList
          data={filteredPayments}
          keyExtractor={item => item.id.toString()}
          renderItem={renderPaymentItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007bff']} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cash-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                {selectedFilter === 'all'
                  ? 'No hay pagos registrados'
                  : `No hay pagos con estado "${STATUS_FILTERS.find(o => o.key === selectedFilter)?.label}"`}
              </Text>
              {selectedSedeId !== null ? (
                <Text style={styles.emptySubText}>
                  {`en "${sedes.find(s => s.id === selectedSedeId)?.nombre || 'sede seleccionada'}"`}
                </Text>
              ) : null}
            </View>
          }
        />
      )}

      {/* Visor de imagen */}
      <Modal visible={!!selectedImage} transparent onRequestClose={() => setSelectedImage(null)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeModalButton} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titleBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: '#F5F5F5',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 6,
    gap: 4,
  },
  sectionHeaderText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  sedeFilterRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    flexDirection: 'row',
  },
  sedeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#eee',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sedeChipActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  sedeChipText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  sedeChipTextActive: {
    color: '#fff',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#eee',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterChipActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filterChipText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContent: { padding: 16, paddingTop: 4 },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paymentInfo: { flex: 1 },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mechanicName: {
    fontSize: 13,
    color: '#007bff',
    marginTop: 2,
    fontWeight: '500',
  },
  paymentDate: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  paymentRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sedeLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
    textAlign: 'right',
  },
  paymentDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  receiptContainer: {
    marginTop: 12,
  },
  receiptThumbnail: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginTop: 8,
    resizeMode: 'cover',
  },
  zoomOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 4,
    color: '#bbb',
    fontSize: 14,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
});