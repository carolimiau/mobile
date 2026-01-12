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
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all payments to calculate global total correctly
      const allData = await paymentService.getAllPayments({});
      const allPayments = allData || [];
      
      // Calculate total amount of confirmed payments from ALL data
      const confirmed = allPayments.filter(p => {
        const status = p.estado?.toUpperCase();
        return status === 'CONFIRMADO' || status === 'COMPLETADO';
      });
      const total = confirmed.reduce((sum, p) => sum + (p.monto || 0), 0);
      setTotalAmount(total);

      // Filter for display based on selection
      let displayData = allPayments;
      if (selectedFilter !== 'all') {
        const targetStatus = selectedFilter.toUpperCase();
        displayData = allPayments.filter(p => {
          const status = p.estado?.toUpperCase();
          if (targetStatus === 'CONFIRMADO') {
            return status === 'CONFIRMADO' || status === 'COMPLETADO';
          }
          if (targetStatus === 'INCOMPLETO') {
            return status === 'INCOMPLETO' || status === 'PENDIENTE';
          }
          return status === targetStatus;
        });
      }

      // Filter by Date Range
      if (startDate || endDate) {
        displayData = displayData.filter(p => {
          const pDate = new Date(p.fechaCreacion);
          // normalize to start of day
          const checkDate = new Date(pDate.getFullYear(), pDate.getMonth(), pDate.getDate());
          
          if (startDate) {
            const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            if (checkDate < start) return false;
          }
          
          if (endDate) {
            const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
            if (checkDate > end) return false;
          }
          return true;
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
      const newPayments = payments.map(p => p.id === paymentId ? updated : p);
      setPayments(newPayments);
      
      // We also need to update the total if the status changed to confirmed
      if (newStatus === 'Confirmado') {
         // Re-run load to recalc totals simplified or just manual update?
         // Simplest is to let loadPayments run again or manual update:
         // But logic is complex with filters. Let's just reload.
         loadPayments(); 
      }
      
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
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    onRefresh,
    updatePaymentStatus,
    loadPayments,
  };
}
