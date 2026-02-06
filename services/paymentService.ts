import apiService from './apiService';

// ==========================================
// 1. INTERFACES EXACTAS AL BACKEND
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

export interface Payment {
  id: string;
  usuarioId: string;
  monto: number;
  estado: PaymentStatus | string; // Permitimos string por si llega texto plano
  metodo: PaymentMethod | string;
  detalles?: string;       // En BD es referenciaExterna
  idempotencyKey?: string; // Aquí viaja el token Webpay
  fechaCreacion: string;
  usuario?: any;
}

export interface InitiateWebpayResponse {
  paymentId: string;
  url: string;
  token: string;
  amount: number;
}

// ==========================================
// 2. MAPEOS VISUALES (UI)
// ==========================================

// Normalizamos para manejar variaciones mayúsculas/minúsculas
const normalizeKey = (key?: string) => key?.trim();

const STATUS_COLOR_MAP: Record<string, string> = {
  [PaymentStatus.COMPLETED]: '#4CAF50', // Verde
  [PaymentStatus.PENDING]: '#FF9800',   // Naranja
  [PaymentStatus.FAILED]: '#F44336',    // Rojo
  [PaymentStatus.REFUNDED]: '#2196F3',  // Azul
  // Compatibilidad hacia atrás (por si acaso)
  'CONFIRMADO': '#4CAF50',
  'PENDIENTE': '#FF9800',
  'COMPLETADO': '#4CAF50',
  'FALLIDO': '#F44336',
};

const STATUS_LABEL_MAP: Record<string, string> = {
  [PaymentStatus.COMPLETED]: 'Completado',
  [PaymentStatus.PENDING]: 'Pendiente',
  [PaymentStatus.FAILED]: 'Fallido',
  [PaymentStatus.REFUNDED]: 'Reembolsado',
};

const PaymentService = {
  /**
   * Obtiene todos los pagos (historial)
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
   * 🚀 INICIAR PAGO WEBPAY (NUEVO)
   * Llama al backend para obtener URL y Token
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
   * Obtiene resumen financiero
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
   * Actualiza estado (Admin)
   */
  async updatePaymentStatus(id: string, estado: string): Promise<Payment> {
    try {
      const response = await apiService.fetch(`/payments/${id}`, {
        method: 'PATCH', // Usamos PATCH según tu controller
        requiresAuth: true,
        body: JSON.stringify({ estado }),
      });
      return response;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },

  // Helpers de Formato
  formatCurrency(amount: number): string {
    try {
      const formatted = new Intl.NumberFormat('es-CL', { 
        style: 'currency', 
        currency: 'CLP', 
        maximumFractionDigits: 0 
      }).format(amount);
      return formatted.replace(/CLP\s?/, '').trim(); // Quitamos "CLP" si aparece
    } catch {
      return `$${amount}`;
    }
  },

  getStatusColor(estado?: string): string {
    const nk = normalizeKey(estado);
    // Buscamos exacto o devolvemos gris
    return STATUS_COLOR_MAP[nk] || STATUS_COLOR_MAP[nk?.charAt(0).toUpperCase() + nk?.slice(1).toLowerCase()!] || '#999';
  },

  getStatusLabel(estado?: string): string {
    const nk = normalizeKey(estado);
    return STATUS_LABEL_MAP[nk] || estado || 'Desconocido';
  }
};

export default PaymentService;