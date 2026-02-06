import apiService from './apiService';
// 👇 ESTA LÍNEA ES CLAVE: Importamos la interfaz de tus tipos globales
// para que coincida exactamente con lo que espera tu pantalla.
import { MechanicPayment } from '../types'; 

// ==========================================
// 1. ENUMS Y TIPOS LOCALES (Solo lo que no está en global)
// ==========================================

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

// Interfaz para la respuesta de inicio de Webpay
export interface InitiateWebpayResponse {
  paymentId: string;
  url: string;
  token: string;
  amount: number;
}

// Interfaz básica de Pago (si no existe en types global, la usamos aquí)
export interface Payment {
  id: string;
  usuarioId: string;
  monto: number;
  estado: PaymentStatus | string;
  metodo: PaymentMethod | string;
  detalles?: string;       
  fechaCreacion: string;
  usuario?: any;
}

// ==========================================
// 2. CONFIGURACIÓN VISUAL (Colores y Etiquetas)
// ==========================================

const normalizeKey = (key?: string) => key?.trim();

// ✅ CORREGIDO: Sin claves duplicadas. Usamos el Enum como llave única.
const STATUS_COLOR_MAP: Record<string, string> = {
  [PaymentStatus.COMPLETED]: '#4CAF50', // Verde
  [PaymentStatus.PENDING]: '#FF9800',   // Naranja
  [PaymentStatus.FAILED]: '#F44336',    // Rojo
  [PaymentStatus.REFUNDED]: '#2196F3',  // Azul
};

const STATUS_LABEL_MAP: Record<string, string> = {
  [PaymentStatus.COMPLETED]: 'Completado',
  [PaymentStatus.PENDING]: 'Pendiente',
  [PaymentStatus.FAILED]: 'Fallido',
  [PaymentStatus.REFUNDED]: 'Reembolsado',
};

// ==========================================
// 3. EL SERVICIO (Lógica de Negocio)
// ==========================================

const PaymentService = {
  /**
   * Obtiene todos los pagos (historial general)
   */
  async getAllPayments(filters?: any): Promise<Payment[]> {
    try {
      const query = filters ? new URLSearchParams(filters).toString() : '';
      const response = await apiService.fetch(`/payments?${query}`, {
        method: 'GET',
        requiresAuth: true,
      });
      return response || [];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  },

  /**
   * 🟢 Obtiene los pagos de un mecánico específico
   * Retorna MechanicPayment[] importado de types para evitar conflictos.
   */
  async getMechanicPayouts(mechanicId: string): Promise<MechanicPayment[]> {
    try {
      const response = await apiService.fetch(`/payments/mechanic/${mechanicId}`, {
        method: 'GET',
        requiresAuth: true,
      });
      return response || [];
    } catch (error) {
      console.error('Error fetching mechanic payouts:', error);
      return [];
    }
  },

  /**
   * 🚀 INICIAR PAGO WEBPAY
   * Esta es la función que usarás para integrar la pasarela.
   */
  async initiateWebpay(monto: number, usuarioId: string, detalles: string = 'Pago Servicio'): Promise<InitiateWebpayResponse> {
    try {
      const response = await apiService.post('/payments/webpay/init', {
        monto,
        usuarioId,
        detalles,
        metodo: PaymentMethod.WEBPAY
      });
      return response;
    } catch (error) {
      console.error('Error iniciando Webpay:', error);
      throw error;
    }
  },

  /**
   * Obtiene resumen financiero (Dashboard)
   */
  async getFinancialSummary() {
    try {
      return await apiService.fetch('/payments/summary/financial', {
        method: 'GET',
        requiresAuth: true,
      });
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      return { totalConfirmed: 0, totalUserBalance: 0, totalMechanicWithdrawals: 0 };
    }
  },

  /**
   * Actualiza estado de un pago (Admin)
   */
  async updatePaymentStatus(id: string, estado: string): Promise<Payment> {
    try {
      const response = await apiService.fetch(`/payments/${id}`, {
        method: 'PATCH',
        requiresAuth: true,
        body: JSON.stringify({ estado }),
      });
      return response;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },

  // ==========================================
  // 4. HELPERS DE FORMATO
  // ==========================================

  formatCurrency(amount: number): string {
    try {
      const formatted = new Intl.NumberFormat('es-CL', { 
        style: 'currency', 
        currency: 'CLP', 
        maximumFractionDigits: 0 
      }).format(amount);
      return formatted.replace(/CLP\s?/, '').trim();
    } catch {
      return `$${amount}`;
    }
  },

  getStatusColor(estado?: string): string {
    const nk = normalizeKey(estado);
    // Intenta buscar exacto, o capitalizado (ej: "pendiente" -> "Pendiente")
    const key = nk ? (STATUS_COLOR_MAP[nk] ? nk : nk.charAt(0).toUpperCase() + nk.slice(1).toLowerCase()) : '';
    return STATUS_COLOR_MAP[key] || '#999';
  },

  getStatusLabel(estado?: string): string {
    const nk = normalizeKey(estado);
    const key = nk ? (STATUS_LABEL_MAP[nk] ? nk : nk.charAt(0).toUpperCase() + nk.slice(1).toLowerCase()) : '';
    return STATUS_LABEL_MAP[key] || estado || 'Desconocido';
  }
};

export default PaymentService;