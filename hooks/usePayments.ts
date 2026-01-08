import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import paymentService from '../services/paymentService';
import { Payment } from '../types';

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'confirmado' | 'incompleto' | 'cancelado'>('all');
  const [totalAmount, setTotalAmount] = useState(0);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const filter = selectedFilter === 'all' ? undefined : selectedFilter.toUpperCase();
      const data = await paymentService.getAllPayments({
        estado: filter,
      });
      setPayments(data || []);
      
      // Calcular monto total de pagos confirmados
      const confirmed = (data || []).filter(p => p.estado?.toUpperCase() === 'CONFIRMADO');
      const total = confirmed.reduce((sum, p) => sum + (p.monto || 0), 0);
      setTotalAmount(total);
    } catch (error) {
      console.error('Error loading payments:', error);
      Alert.alert('Error', 'No se pudieron cargar los pagos');
    } finally {
      setLoading(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadPayments();
    } finally {
      setRefreshing(false);
    }
  };

  const updatePaymentStatus = async (paymentId: string, newStatus: string) => {
    try {
      const updated = await paymentService.updatePaymentStatus(paymentId, newStatus);
      setPayments(payments.map(p => p.id === paymentId ? updated : p));
      Alert.alert('Éxito', 'Estado del pago actualizado');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado del pago');
    }
  };

  return {
    payments,
    loading,
    refreshing,
    selectedFilter,
    setSelectedFilter,
    totalAmount,
    onRefresh,
    updatePaymentStatus,
    loadPayments,
  };
}
