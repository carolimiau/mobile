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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import paymentService from '../../services/paymentService';
import authService from '../../services/authService';
import { MechanicPayment } from '../../types/index';
import { getImageUrl } from '../../utils/imageUtils';

type FilterStatus = 'all' | 'pendiente' | 'pagado' | 'rechazado';

const FILTER_OPTIONS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'pagado', label: 'Pagado' },
  { key: 'rechazado', label: 'Rechazado' },
];

function getStatusColor(estado?: string): string {
  if (!estado) return '#4CAF50'; // Sin estado = pagado (registro histórico)
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

export default function MechanicPaymentsScreen() {
  const [allPayments, setAllPayments] = useState<MechanicPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadPayments = async () => {
    try {
      const user = await authService.getUser();
      if (!user) {
        Alert.alert('Error', 'No se pudo obtener la información de sesión');
        return;
      }
      const data = await paymentService.getMechanicPayouts(user.id);
      setAllPayments(data || []);
    } catch (error) {
      console.error('Error cargando pagos del mecánico:', error);
      Alert.alert('Error', 'No se pudieron cargar los pagos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadPayments();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  const filteredPayments = allPayments.filter(item => matchesFilter(item, selectedFilter));

  // Totales resumidos
  const totalPagado = allPayments
    .filter(p => matchesFilter(p, 'pagado'))
    .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

  const renderPaymentItem = ({ item }: { item: MechanicPayment }) => {
    const isExpanded = expandedId === item.id;
    const statusColor = getStatusColor(item.estado);
    const statusLabel = getStatusLabel(item.estado);

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
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#666"
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
      {/* Resumen */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Recibido</Text>
          <Text style={styles.summaryValue}>{paymentService.formatCurrency(totalPagado)}</Text>
        </View>
        <View style={[styles.summaryItem, styles.summaryDivider]}>
          <Text style={styles.summaryLabel}>Registros</Text>
          <Text style={styles.summaryValue}>{allPayments.length}</Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.filterChip, selectedFilter === opt.key && styles.filterChipActive]}
            onPress={() => setSelectedFilter(opt.key)}
          >
            <Text
              style={[styles.filterChipText, selectedFilter === opt.key && styles.filterChipTextActive]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF9800" />
        </View>
      ) : (
        <FlatList
          data={filteredPayments}
          keyExtractor={item => item.id.toString()}
          renderItem={renderPaymentItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF9800']} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                {selectedFilter === 'all'
                  ? 'No hay pagos registrados'
                  : `No hay pagos con estado "${FILTER_OPTIONS.find(o => o.key === selectedFilter)?.label}"`}
              </Text>
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
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
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
    alignItems: 'center',
  },
  paymentInfo: {},
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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