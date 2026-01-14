import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Platform, Image, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import paymentService from '../../services/paymentService';
import { MechanicPayment } from '../../types';
import { getImageUrl } from '../../utils/imageUtils';

export default function MechanicPaymentsScreen() {
  const { mechanicId, mechanicName } = useLocalSearchParams();
  const router = useRouter();
  const [payments, setPayments] = useState<MechanicPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  // Image Viewer State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (mechanicId) {
      loadPayments();
    }
  }, [mechanicId]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getMechanicPayouts(mechanicId as string);
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading mechanic payments:', error);
      Alert.alert('Error', 'No se pudieron cargar los pagos del mecánico');
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentItem = ({ item }: { item: MechanicPayment }) => {
    const isExpanded = expandedId === item.id;
    // PagoMecanico typically represents a completed payment since it's a record of payment made
    const statusColor = '#4CAF50'; 

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
              {new Date(item.fecha_pago).toLocaleDateString('es-CL')}
            </Text>
          </View>

          <View style={styles.paymentRight}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>Pagado</Text>
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
            {item.nota && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nota:</Text>
                <Text style={styles.detailValue}>{item.nota}</Text>
              </View>
            )}
            
            {/* View Receipt Image if available */}
            {item.comprobante_url && (
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
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <Screen backgroundColor="#fff">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagos de {mechanicName || 'Mecánico'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
          <FlatList
            data={payments}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderPaymentItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="wallet-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No hay pagos registrados</Text>
              </View>
            }
          />
        </View>
      )}

      {/* Image Modal */}
      <Modal visible={!!selectedImage} transparent={true} onRequestClose={() => setSelectedImage(null)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeModalButton} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image 
                source={{ uri: selectedImage }} 
                style={styles.fullScreenImage} 
                resizeMode="contain"
            />
          )}
        </View>
      </Modal>

    </Screen>
  );
}

const styles = StyleSheet.create({
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  backButton: { padding: 4 },
  listContent: { padding: 16 },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    paddingHorizontal: 8,
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
    marginBottom: 12,
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
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonDanger: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
