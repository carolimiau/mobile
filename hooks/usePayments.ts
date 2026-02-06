import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import paymentService, { Payment, PaymentStatus } from '../services/paymentService';

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtro visual para el usuario
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'confirmado' | 'pendiente' | 'fallido'>('all');
  
  const [totalAmount, setTotalAmount] = useState(0);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const allData = await paymentService.getAllPayments({});
      const allPayments = allData || [];
      
      // 1. Calcular total histórico de pagos COMPLETADOS
      const confirmed = allPayments.filter(p => {
        // Normalizamos comparación (Backend envía 'Completado')
        return p.estado === PaymentStatus.COMPLETED || p.estado === 'Completado';
      });
      
      const total = confirmed.reduce((sum, p) => sum + (Number(p.monto) || 0), 0);
      setTotalAmount(total);

      // 2. Filtrar para mostrar en lista
      let displayData = allPayments;

      if (selectedFilter !== 'all') {
        displayData = displayData.filter(p => {
          const status = p.estado;
          if (selectedFilter === 'confirmado') return status === PaymentStatus.COMPLETED || status === 'Completado';
          if (selectedFilter === 'pendiente') return status === PaymentStatus.PENDING || status === 'Pendiente';
          if (selectedFilter === 'fallido') return status === PaymentStatus.FAILED || status === 'Fallido';
          return true;
        });
      }

      // Filtro de Fechas
      if (startDate && endDate) {
        displayData = displayData.filter(p => {
          const pDate = new Date(p.fechaCreacion);
          return pDate >= startDate && pDate <= endDate;
        });
      }

      setPayments(displayData);
    } catch (error) {
      console.error('Error loading payments:', error);
      Alert.alert('Error', 'No se pudieron cargar los pagos');
    } finally {
      setLoading(false);
    }
  }, [selectedFilter, startDate, endDate]);

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
      
      // Actualizamos la lista localmente
      const newPayments = payments.map(p => p.id === paymentId ? updated : p);
      setPayments(newPayments);
      
      // Si cambió a completado, recargamos para actualizar el total monetario
      if (newStatus === PaymentStatus.COMPLETED) {
         loadPayments(); 
      }
      
      Alert.alert('Éxito', 'Estado actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  return {
    payments,
    loading,
    refreshing,
    selectedFilter,
    setSelectedFilter,
    totalAmount,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    onRefresh,
    updatePaymentStatus,
  };
}