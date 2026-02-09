import apiService from './apiService';
// 👇 Importamos la interfaz desde tu archivo central de tipos
import { MechanicPayment } from '../types';

// --- Enums y Tipos para Pagos de Usuarios ---

export enum PaymentStatus {
  PENDING = 'Pendiente',
  COMPLETED = 'Completado',
  FAILED = 'Fallido',
  REFUNDED = 'Reembolsado',
}

export enum PaymentMethod {
  WEBPAY = 'WebPay',
  TRANSFER = 'Transferencia',
  CASH = 'Efectivo',
  SALDO_AUTOBOX = 'Saldo AutoBox',
}

export interface Payment {
  id: string;
  usuarioId: string;
  monto: number;
  estado: PaymentStatus | string;
  metodo: PaymentMethod | string;
  detalles?: string;
  fechaCreacion: string; // ISO String
  usuario?: {
    nombre: string;
    apellido: string;
    email: string;
  };
  token?: string;
  idempotencyKey?: string;
  transactionDate?: string;
}

export interface FinancialSummary {
  totalConfirmed: number;
  totalUserBalance: number;
  totalMechanicWithdrawals: number;
}

// --- Servicio Principal ---

const paymentService = {
  
  // ==========================================
  // 1. Gestión de Pagos Generales (Usuarios)
  // ==========================================

  async getAllPayments(): Promise<Payment[]> {
    try {
      const response = await apiService.get('/payments');
      return response || [];
    } catch (error) {
      console.error('Error obteniendo todos los pagos:', error);
      return [];
    }
  },

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    try {
      const response = await apiService.get(`/payments/user/${userId}`);
      return response || [];
    } catch (error) {
      console.error('Error obteniendo pagos del usuario:', error);
      return [];
    }
  },

  async updatePaymentStatus(id: string, status: PaymentStatus): Promise<Payment | null> {
    try {
      const response = await apiService.patch(`/payments/${id}/status`, { estado: status });
      return response;
    } catch (error) {
      console.error('Error actualizando estado de pago:', error);
      throw error;
    }
  },

  async getFinancialSummary(): Promise<FinancialSummary> {
    try {
      const response = await apiService.get('/payments/summary/financial');
      return response;
    } catch (error) {
      console.log('Resumen financiero no disponible, usando valores cero.');
      return { 
        totalConfirmed: 0, 
        totalUserBalance: 0, 
        totalMechanicWithdrawals: 0 
      };
    }
  },

  // ==========================================
  // 2. Gestión de Pagos a Mecánicos (IMPLEMENTADO)
  // ==========================================

  /**
   * Obtiene el historial de pagos realizados a un mecánico específico.
   */
  async getMechanicPayouts(mechanicId: string): Promise<MechanicPayment[]> {
    try {
      const response = await apiService.get(`/payments/mechanic/${mechanicId}`);
      return response || [];
    } catch (error) {
      console.error('Error obteniendo pagos del mecánico:', error);
      return [];
    }
  },

  /**
   * Registra un nuevo pago manual a un mecánico, incluyendo foto del comprobante.
   */
  async registerMechanicPayout(
    mechanicId: string, 
    amount: string, 
    note: string, 
    receiptImage: any
  ): Promise<MechanicPayment> {
    try {
      const formData = new FormData();
      
      formData.append('mecanicoId', mechanicId);
      formData.append('monto', amount);
      formData.append('nota', note || '');

      if (receiptImage) {
        // Estructura de archivo para React Native
        const fileToUpload: any = {
          uri: receiptImage.uri,
          type: 'image/jpeg', // Puedes usar receiptImage.mimeType si está disponible
          name: receiptImage.fileName || `receipt-${Date.now()}.jpg`,
        };
        formData.append('comprobante', fileToUpload);
      }

      // CORRECCIÓN AQUI: Ya no pasamos el tercer argumento { headers }.
      // apiService.post(url, data) es lo correcto.
      // React Native ajustará el Content-Type para FormData automáticamente.
      const response = await apiService.post('/payments/mechanic', formData);
      
      return response;
    } catch (error) {
      console.error('Error registrando pago a mecánico:', error);
      throw error;
    }
  },

  /**
   * Elimina un registro de pago a mecánico (por si hubo error en la carga manual).
   */
  async deleteMechanicPayout(paymentId: number): Promise<void> {
    try {
      await apiService.delete(`/payments/mechanic/${paymentId}`);
    } catch (error) {
      console.error('Error eliminando pago a mecánico:', error);
      throw error;
    }
  },

  // ==========================================
  // 3. Helpers Visuales (UI)
  // ==========================================

  formatCurrency(amount: number | string): string {
    if (amount === undefined || amount === null) return '$0';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return '$' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  },

  getStatusColor(estado?: string): string {
    if (!estado) return '#999';
    const upperStatus = estado.toUpperCase();
    
    // Estados generales
    if (upperStatus.includes('COMPLET') || upperStatus === 'PAGADO') return '#4CAF50'; // Verde
    if (upperStatus.includes('PEND')) return '#FF9800'; // Naranja
    if (upperStatus.includes('FAIL') || upperStatus.includes('FALL')) return '#F44336'; // Rojo
    if (upperStatus.includes('REFUND') || upperStatus.includes('REEMB')) return '#9C27B0'; // Morado
    
    return '#999';
  },

  getStatusLabel(estado?: string): string {
    if (!estado) return 'Desconocido';
    const upperStatus = estado.toUpperCase();
    
    if (upperStatus === 'PENDING') return 'Pendiente';
    if (upperStatus === 'COMPLETED') return 'Completado';
    if (upperStatus === 'FAILED') return 'Fallido';
    if (upperStatus === 'REFUNDED') return 'Reembolsado';
    
    return estado; // Retorna el string original si no coincide
  }
};

export default paymentService;