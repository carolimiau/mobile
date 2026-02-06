import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { usePayments } from '../../hooks/usePayments';
import paymentService, { Payment, PaymentStatus } from '../../services/paymentService';

export default function PaymentsScreen() {
  const {
    payments,
    loading,
    refreshing,
    selectedFilter,
    setSelectedFilter,
    onRefresh: refreshPaymentsList, // Renombramos la del hook para usarla en nuestro wrapper
    updatePaymentStatus,
    totalAmount
  } = usePayments();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Estado local para los totales (Resumen financiero)
  const [financialSummary, setFinancialSummary] = useState({ 
    totalConfirmed: 0, 
    totalUserBalance: 0, 
    totalMechanicWithdrawals: 0 
  });

  // Cargar resumen al montar
  useEffect(() => {
     loadFinancialSummary();
  }, []);

  const loadFinancialSummary = async () => {
     try {
       const summary = await paymentService.getFinancialSummary();
       setFinancialSummary(summary);
     } catch (error) {
       console.log('Error cargando resumen', error);
     }
  };

  // 🔄 Wrapper para actualizar TODO (Lista + Resumen) al deslizar
  const handleRefresh = async () => {
    // 1. Recargar resumen financiero
    loadFinancialSummary();
    // 2. Recargar lista de pagos (del hook)
    await refreshPaymentsList();
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }: { item: Payment }) => {
    const isExpanded = expandedId === item.id;
    const statusColor = paymentService.getStatusColor(item.estado);
    const date = new Date(item.fechaCreacion).toLocaleDateString('es-CL');
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => toggleExpand(item.id)}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconBg, { backgroundColor: statusColor + '20' }]}>
              <Ionicons 
                name={item.metodo === 'WebPay' ? 'card-outline' : 'cash-outline'} 
                size={24} 
                color={statusColor} 
              />
            </View>
          </View>
          
          <View style={styles.cardInfo}>
            <Text style={styles.amount}>{paymentService.formatCurrency(item.monto)}</Text>
            <Text style={styles.userText}>
              {item.usuario?.nombre ? `${item.usuario.nombre} ${item.usuario.apellido}` : 'Usuario'}
            </Text>
            <Text style={styles.dateText}>{date} • {item.metodo}</Text>
          </View>

          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>
                {paymentService.getStatusLabel(item.estado)}
              </Text>
            </View>
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#999" 
              style={{ marginTop: 4, alignSelf: 'flex-end' }}
            />
          </View>
        </View>

        {isExpanded && (
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ID Transacción (Webpay):</Text>
              {/* Mostramos el token/idempotencyKey si existe */}
              <Text style={styles.detailValue}>{item.idempotencyKey || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Detalle (Orden):</Text>
              <Text style={styles.detailValue}>{item.detalles || 'Sin detalles'}</Text>
            </View>

            <View style={styles.actionsRow}>
                {/* Botón Manual solo si está Pendiente */}
                {item.estado === PaymentStatus.PENDING && (
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                    onPress={() => updatePaymentStatus(item.id, PaymentStatus.COMPLETED)}
                  >
                    <Text style={styles.actionText}>Marcar Completado</Text>
                  </TouchableOpacity>
                )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Screen>
      {/* 👇 AQUÍ REEMPLAZAMOS LA FUNCIÓN 'title' POR UN HEADER MANUAL 👇 */}
      <View style={styles.headerContainer}>
        <Text style={styles.screenTitle}>Gestión de Pagos</Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Ingresos</Text>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
              {paymentService.formatCurrency(financialSummary.totalConfirmed)}
            </Text>
        </View>
        <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Retiros Mecánicos</Text>
            <Text style={[styles.summaryValue, { color: '#F44336' }]}>
              {paymentService.formatCurrency(financialSummary.totalMechanicWithdrawals)}
            </Text>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <TouchableOpacity 
          style={[styles.filterChip, selectedFilter === 'all' && styles.activeFilter]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterText, selectedFilter === 'all' && styles.activeFilterText]}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, selectedFilter === 'confirmado' && styles.activeFilter]}
          onPress={() => setSelectedFilter('confirmado')}
        >
          <Text style={[styles.filterText, selectedFilter === 'confirmado' && styles.activeFilterText]}>Completados</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, selectedFilter === 'pendiente' && styles.activeFilter]}
          onPress={() => setSelectedFilter('pendiente')}
        >
          <Text style={[styles.filterText, selectedFilter === 'pendiente' && styles.activeFilterText]}>Pendientes</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={payments}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay pagos registrados</Text>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // ESTILOS NUEVOS PARA EL TÍTULO MANUAL
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    elevation: 2,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: '#007bff',
  },
  filterText: {
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailsContainer: {
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
    fontSize: 12,
    color: '#999',
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    maxWidth: '70%',
    textAlign: 'right',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
  },
});