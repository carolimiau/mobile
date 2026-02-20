import { Alert } from 'react-native';
import apiService from './apiService';

// ==========================================
// 1. DEFINICIÓN DE TIPOS
// ==========================================

export enum PaymentStatus {
  PENDING = 'Pendiente',
  COMPLETED = 'Completado',
  FAILED = 'Fallido',
  REFUNDED = 'Reembolsado',
  REJECTED = 'Rechazado'
}

export enum PaymentMethod {
  WEBPAY = 'WebPay',
  TRANSFER = 'Transferencia',
  CASH = 'Efectivo',
  SALDO_AUTOBOX = 'Saldo AutoBox'
}

export interface Payment {
  id: string;
  usuarioId: string;
  monto: number;
  estado: PaymentStatus | string;
  metodo: PaymentMethod | string;
  fechaCreacion: string;
  detalles?: string;
  usuario?: {
    nombre: string;
    apellido: string;
    email: string;
  };
  token?: string;
  idempotencyKey?: string;
  transactionDate?: string;
}

// Interface alineada con la entidad PagoMecanico del backend
// y con MechanicPayment de types/index.ts
export interface MechanicPayment {
  id: number;
  mecanico_id: string;
  monto: number;
  nota?: string;
  comprobante_url: string;
  fecha_pago: string;
  estado?: string;
  created_at?: string;
  // Relación mecanico que devuelve el backend (leftJoinAndSelect)
  mecanico?: {
    id: string;
    primerNombre: string;
    primerApellido: string;
    email?: string;
  };
  // Alias usado por el frontend para mostrar nombre (mapeado al cargar)
  mechanic?: {
    id: string;
    firstName: string;
    lastName: string;
    module?: string;
  };
  sedeId?: number;
  sede?: {
    id: number;
    nombre: string;
  };
}

// Respuesta paginada que devuelve el endpoint GET /admin/mechanic-payments
export interface MechanicPaymentsResponse {
  data: MechanicPayment[];
  total: number;
  limit: number;
  offset: number;
}

export interface FinancialSummary {
  totalConfirmed: number;
  totalUserBalance: number;
  totalMechanicWithdrawals: number;
}

export interface WebpayInitResponse {
  url: string;
  token: string;
}

// ==========================================
// 2. CONFIGURACIÓN Y SERVICIO
// ==========================================

const HARDCODED_PAYMENT_URL = 'https://payment-uby0.onrender.com';

/**
 * Mapea el campo 'mecanico' (snake_case del backend) al alias 'mechanic'
 * (camelCase) que usa la UI para mostrar nombre del mecánico.
 */
function normalizeMechanicPayment(item: MechanicPayment): MechanicPayment {
  if (item.mecanico && !item.mechanic) {
    item.mechanic = {
      id: item.mecanico.id,
      firstName: item.mecanico.primerNombre,
      lastName: item.mecanico.primerApellido,
    };
  }
  return item;
}

const paymentService = {

  // ---------------------------------------------------------
  // 1. INICIAR PAGO WEBPAY
  // ---------------------------------------------------------

  async initiateWebPayTransaction(amount: number, buyOrder: string, sessionId: string): Promise<WebpayInitResponse> {
    console.log("🚀 1. INICIANDO PAGO...");
    const targetUrl = `${HARDCODED_PAYMENT_URL}/create`;

    try {
      const payload = {
        amount,
        monto: amount,
        buyOrder,
        ordenCompra: buyOrder,
        sessionId,
        idSesion: sessionId,
        returnUrl: `${HARDCODED_PAYMENT_URL}/commit`
      };

      console.log("📦 Enviando datos:", JSON.stringify(payload));

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      console.log("📡 2. Status del Servidor:", response.status);

      if (!response.ok) {
        const text = await response.text();
        Alert.alert("Error del Servidor", `Status: ${response.status}\nMensaje: ${text}`);
        throw new Error(`Server Error: ${response.status}`);
      }

      const responseText = await response.text();
      console.log("📩 3. Respuesta RAW:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        Alert.alert("Error Formato", "El servidor no devolvió JSON:\n" + responseText.substring(0, 100));
        throw new Error("Invalid JSON response");
      }

      const webpayUrl = data.url || data.response?.url || data.data?.url;
      const webpayToken = data.token || data.response?.token || data.data?.token;

      if (webpayUrl && webpayToken) {
        return { url: webpayUrl, token: webpayToken };
      } else {
        Alert.alert("Faltan Datos", `Recibimos esto:\n${JSON.stringify(data)}`);
        throw new Error("No URL in response");
      }

    } catch (error: any) {
      console.error("❌ ERROR FINAL:", error);
      if (!error.message.includes("Error del Servidor") && !error.message.includes("Faltan Datos")) {
        Alert.alert("Error al cargar WebPay", error.message);
      }
      throw error;
    }
  },

  // ---------------------------------------------------------
  // 2. GESTIÓN DE PAGOS (HISTORIAL)
  // ---------------------------------------------------------

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

  async updatePaymentStatus(id: string, status: PaymentStatus): Promise<any> {
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
      return response || { totalConfirmed: 0, totalUserBalance: 0, totalMechanicWithdrawals: 0 };
    } catch (error) {
      return { totalConfirmed: 0, totalUserBalance: 0, totalMechanicWithdrawals: 0 };
    }
  },

  // ---------------------------------------------------------
  // 3. GESTIÓN DE PAGOS A MECÁNICOS
  // ---------------------------------------------------------

  /**
   * getMechanicPayouts — Pagos de UN mecánico específico (vista del mecánico).
   * Endpoint: GET /admin/mechanics/:id/payouts  →  MechanicsService.getPayouts()
   * FIX: Antes llamaba a /payments/mechanic/:id (ruta inexistente).
   */
  async getMechanicPayouts(mechanicId: string): Promise<MechanicPayment[]> {
    try {
      const response = await apiService.get(`/mechanics/${mechanicId}/payouts`);
      const items: MechanicPayment[] = response || [];
      return items.map(normalizeMechanicPayment);
    } catch (error) {
      console.error('Error obteniendo pagos del mecánico:', error);
      return [];
    }
  },

  /**
   * getAllMechanicPayouts — Todos los pagos a mecánicos (vista admin con filtros).
   * Endpoint: GET /admin/mechanic-payments (con query params opcionales)
   * FIX: Antes llamaba a /admin/mechanic-payouts (ruta inexistente en el controller).
   * FIX: El backend devuelve { data, total, limit, offset } — se extrae data[].
   */
  async getAllMechanicPayouts(
    sedeId?: number,
    mechanicId?: string,
    startDate?: string,
    endDate?: string,
    limit?: number,
    offset?: number,
  ): Promise<MechanicPayment[]> {
    try {
      const params = new URLSearchParams();
      if (sedeId !== undefined) params.append('sedeId', sedeId.toString());
      if (mechanicId) params.append('mechanicId', mechanicId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (limit !== undefined) params.append('limit', limit.toString());
      if (offset !== undefined) params.append('offset', offset.toString());

      const query = params.toString() ? `?${params.toString()}` : '';
      const response: MechanicPaymentsResponse = await apiService.get(`/admin/mechanic-payments${query}`);

      // FIX CRÍTICO: el backend devuelve { data: [], total, limit, offset }
      // El frontend esperaba un array directo → crash silencioso con .filter()
      const items: MechanicPayment[] = response?.data || [];
      return items.map(normalizeMechanicPayment);
    } catch (error) {
      console.error('Error obteniendo todos los pagos a mecánicos:', error);
      return [];
    }
  },

  async registerMechanicPayout(mechanicId: string, amount: string, note: string, receiptImage: any): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('mecanicoId', mechanicId);
      formData.append('monto', amount);
      formData.append('nota', note || '');

      if (receiptImage) {
        const fileToUpload: any = {
          uri: receiptImage.uri,
          type: 'image/jpeg',
          name: receiptImage.fileName || `receipt-${Date.now()}.jpg`,
        };
        formData.append('comprobante', fileToUpload);
      }

      const response = await apiService.post('/payments/mechanic', formData);
      return response;
    } catch (error) {
      console.error('Error registrando pago a mecánico:', error);
      throw error;
    }
  },

  async deleteMechanicPayout(paymentId: number): Promise<void> {
    try {
      await apiService.delete(`/payments/mechanic/${paymentId}`);
    } catch (error) {
      console.error('Error eliminando pago a mecánico:', error);
      throw error;
    }
  },

  // ---------------------------------------------------------
  // 4. HELPERS VISUALES
  // ---------------------------------------------------------

  formatCurrency(amount: number | string): string {
    if (amount === undefined || amount === null) return '$0';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return '$' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  },

  getStatusColor(estado?: string): string {
    if (!estado) return '#999';
    const upperStatus = estado.toUpperCase();
    if (upperStatus.includes('COMPLET') || upperStatus.includes('AUTHORIZ') || upperStatus === 'PAGADO') return '#4CAF50';
    if (upperStatus.includes('PEND')) return '#FF9800';
    if (upperStatus.includes('FAIL') || upperStatus.includes('FALL') || upperStatus.includes('REJECT')) return '#F44336';
    if (upperStatus.includes('REFUND') || upperStatus.includes('REEMB')) return '#9C27B0';
    return '#999';
  },

  getStatusLabel(estado?: string): string {
    if (!estado) return 'Desconocido';
    const upperStatus = estado.toUpperCase();
    if (upperStatus === 'PENDING') return 'Pendiente';
    if (upperStatus === 'COMPLETED' || upperStatus === 'AUTHORIZED') return 'Aprobado';
    if (upperStatus === 'FAILED') return 'Fallido';
    if (upperStatus === 'REFUNDED') return 'Reembolsado';
    if (upperStatus === 'REJECTED') return 'Rechazado';
    return estado;
  }
};

export default paymentService;