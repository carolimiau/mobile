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
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { usePayments } from '../../hooks/usePayments';
import paymentService from '../../services/paymentService';

export default function PaymentsScreen() {
  const {
    payments,
    loading,
    refreshing,
    selectedFilter,
    setSelectedFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    onRefresh: originalOnRefresh,
    updatePaymentStatus,
  } = usePayments();

  // Local state for financial summary
  const [financialSummary, setFinancialSummary] = useState({ 
    totalConfirmed: 0, 
    totalUserBalance: 0, 
    totalMechanicWithdrawals: 0 
  });

  useEffect(() => {
     loadFinancialSummary();
  }, [refreshing]);

  const loadFinancialSummary = async () => {
     const summary = await paymentService.getFinancialSummary();
     setFinancialSummary(summary);
  };

  const onRefresh = async () => {
    await originalOnRefresh();
    await loadFinancialSummary();
  };

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (event.type === 'dismissed') {
      return;
    }

    if (selectedDate) {
      if (pickerMode === 'start') {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };

  const showDatePicker = (mode: 'start' | 'end') => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  const clearDates = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const renderFilterButton = (filter: typeof selectedFilter, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === filter && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderPaymentItem = ({ item }: { item: any }) => {
    const isExpanded = expandedId === item.id;
    const isWithdrawal = item.tipo === 'RETIRO' || item.metodo === 'Retiro';
    const statusColor = paymentService.getStatusColor(item.estado);

    return (
      <View style={styles.paymentCard}>
        <TouchableOpacity
          style={styles.paymentHeader}
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.paymentInfo}>
            <Text style={[styles.paymentAmount, isWithdrawal && { color: '#F44336' }]}>
              {isWithdrawal ? '- ' : ''}{paymentService.formatCurrency(item.monto)}
            </Text>
            <Text style={styles.paymentMeta}>
              {isWithdrawal ? 'Mecánico: ' : ''}{item.usuario?.primerNombre} {item.usuario?.primerApellido}
            </Text>
            <Text style={styles.paymentDate}>
              {new Date(item.fechaCreacion).toLocaleDateString('es-CL')}
            </Text>
          </View>

          <View style={styles.paymentRight}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor },
              ]}
            >
              <Text style={styles.statusText}>
                {paymentService.getStatusLabel(item.estado)}
              </Text>
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
              <Text style={styles.detailLabel}>Método:</Text>
              <Text style={styles.detailValue}>
                {paymentService.getMethodLabel(item.metodo)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ID de Pago:</Text>
              <Text style={styles.detailValue}>{item.id.slice(0, 12)}...</Text>
            </View>
            {item.detalles && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Detalles:</Text>
                <Text style={styles.detailValue}>{item.detalles}</Text>
              </View>
            )}
            {item.idempotencyKey && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ref Idempotencia:</Text>
                <Text style={styles.detailValue}>
                  {item.idempotencyKey.slice(0, 12)}...
                </Text>
              </View>
            )}

            {item.estado?.toUpperCase() === 'INCOMPLETO' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  Alert.alert(
                    'Cambiar a Confirmado',
                    '¿Estás seguro de marcar este pago como confirmado?',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Confirmar',
                        onPress: () => updatePaymentStatus(item.id, 'Confirmado'),
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Confirmar Pago</Text>
              </TouchableOpacity>
            )}

            {item.estado?.toUpperCase() !== 'CANCELADO' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonDanger]}
                onPress={() => {
                  Alert.alert(
                    'Cancelar Pago',
                    '¿Estás seguro de cancelar este pago?',
                    [
                      { text: 'No', style: 'cancel' },
                      {
                        text: 'Sí, cancelar',
                        onPress: () => updatePaymentStatus(item.id, 'Cancelado'),
                        style: 'destructive',
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="close-circle" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Cancelar Pago</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <Screen backgroundColor="#F5F5F5">
      <View style={styles.container}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Confirmado</Text>
            <Text style={styles.summaryAmount}>
              {paymentService.formatCurrency(financialSummary.totalConfirmed)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Retiros Mec.</Text>
            <Text style={[styles.summaryAmount, { color: '#F44336' }]}>
              {paymentService.formatCurrency(financialSummary.totalMechanicWithdrawals)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Saldo Usuarios</Text>
            <Text style={styles.summaryAmount}>
              {paymentService.formatCurrency(financialSummary.totalUserBalance)}
            </Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterContainer}>
          {renderFilterButton('all', 'Todos')}
          {renderFilterButton('confirmado', 'Confirmados')}
          {renderFilterButton('incompleto', 'Incompletos')}
          {renderFilterButton('cancelado', 'Cancelados')}
        </View>

        {/* Date Filter Controls */}
        <View style={styles.dateFilterContainer}>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => showDatePicker('start')}
          >
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.dateButtonText}>
              {startDate ? startDate.toLocaleDateString('es-CL') : 'Desde'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.dateSeparator}>-</Text>
          
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => showDatePicker('end')}
          >
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.dateButtonText}>
              {endDate ? endDate.toLocaleDateString('es-CL') : 'Hasta'}
            </Text>
          </TouchableOpacity>

          {(startDate || endDate) && (
            <TouchableOpacity onPress={clearDates} style={styles.clearDateButton}>
              <Ionicons name="close-circle" size={20} color="#F44336" />
            </TouchableOpacity>
          )}
        </View>

        {showPicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={pickerMode === 'start' ? (startDate || new Date()) : (endDate || new Date())}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* List */}
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007bff" />
          </View>
        ) : payments.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="wallet-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>
              {selectedFilter === 'all'
                ? 'No hay pagos registrados'
                : `No hay pagos ${paymentService.getStatusLabel(selectedFilter)}`}
            </Text>
          </View>
        ) : (
          <FlatList
            data={payments}
            renderItem={renderPaymentItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#007bff']}
              />
            }
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#EEE',
    marginHorizontal: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
  },
  summarySubtext: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    justifyContent: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    minWidth: 100,
    justifyContent: 'center',
  },
  dateButtonText: {
    marginLeft: 6,
    color: '#333',
    fontSize: 14,
  },
  dateSeparator: {
    marginHorizontal: 8,
    color: '#666',
  },
  clearDateButton: {
    marginLeft: 12,
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginHorizontal: 2,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007bff',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  paymentMeta: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 12,
    color: '#999',
  },
  paymentRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  paymentDetails: {
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  actionButtonDanger: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
});
