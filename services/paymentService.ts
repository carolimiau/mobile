import { Alert } from 'react-native'; // Importante para debugear en el celular
import apiService from './apiService';
import { MechanicPayment } from '../types';

// --- Enums y Tipos ---

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
  fechaCreacion: string;
  usuario?: {
    nombre: string;
    apellido: string;
    email: string;
  };
  token?: string;
  idempotencyKey?: string;
  transactionDate?: string;
}

export interface WebpayInitResponse {
  token: string;
  url: string;
}

export interface FinancialSummary {
  totalConfirmed: number;
  totalUserBalance: number;
  totalMechanicWithdrawals: number;
}

// --- Servicio Principal ---

// 🚨 HARDCODE: Escribimos la URL a fuego para descartar errores de .env
const HARDCODED_PAYMENT_URL = 'https://payment-uby0.onrender.com';

const paymentService = {
  
  // ==========================================
  // 1. INICIAR PAGO WEBPAY (MODO PÁNICO / DEBUG)
  // ==========================================
  
  async initiateWebPayTransaction(amount: number, buyOrder: string, sessionId: string): Promise<WebpayInitResponse> {
    const targetUrl = `${HARDCODED_PAYMENT_URL}/create`;
    const returnUrl = `${HARDCODED_PAYMENT_URL}/commit`;

    console.log('Intentando conectar a:', targetUrl);

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          amount: amount,
          buyOrder: buyOrder,
          sessionId: sessionId,
          returnUrl: returnUrl
        }),
      });

      // 1. Si el servidor responde con error (404, 500, etc)
      if (!response.ok) {
        const errorText = await response.text();
        Alert.alert("Error Servidor", `Status: ${response.status}\n${errorText}`);
        throw new Error(`Error HTTP: ${response.status}`);
      }

      // 2. Intentamos leer el JSON
      const data = await response.json();
      
      // 3. Verificamos que venga la URL y el Token
      if (!data.url || !data.token) {
        Alert.alert("Error Datos", "Transbank no devolvió URL o Token validos.");
        console.error("Respuesta incompleta:", data);
        throw new Error("Datos de Webpay incompletos");
      }

      return data;

    } catch (error: any) {
      // ESTO ES CLAVE: Te mostrará en la pantalla del celular qué pasó
      console.error('Error fatal iniciando Webpay:', error);
      Alert.alert("Error de Conexión", `No se pudo iniciar el pago.\n${error.message}`);
      throw error;
    }
  },

  // ==========================================
  // 2. Gestión de Pagos Generales
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
      return { totalConfirmed: 0, totalUserBalance: 0, totalMechanicWithdrawals: 0 };
    }
  },

  // ==========================================
  // 3. Gestión de Pagos a Mecánicos
  // ==========================================

  async getMechanicPayouts(mechanicId: string): Promise<MechanicPayment[]> {
    try {
      const response = await apiService.get(`/payments/mechanic/${mechanicId}`);
      return response || [];
    } catch (error) {
      console.error('Error obteniendo pagos del mecánico:', error);
      return [];
    }
  },

  async registerMechanicPayout(mechanicId: string, amount: string, note: string, receiptImage: any): Promise<MechanicPayment> {
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

  // ==========================================
  // 4. Helpers Visuales
  // ==========================================

  formatCurrency(amount: number | string): string {
    if (amount === undefined || amount === null) return '$0';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return '$' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  },

  getStatusColor(estado?: string): string {
    if (!estado) return '#999';
    const upperStatus = estado.toUpperCase();
    if (upperStatus.includes('COMPLET') || upperStatus === 'PAGADO') return '#4CAF50';
    if (upperStatus.includes('PEND')) return '#FF9800';
    if (upperStatus.includes('FAIL') || upperStatus.includes('FALL')) return '#F44336';
    if (upperStatus.includes('REFUND') || upperStatus.includes('REEMB')) return '#9C27B0';
    return '#999';
  },

  getStatusLabel(estado?: string): string {
    if (!estado) return 'Desconocido';
    const upperStatus = estado.toUpperCase();
    if (upperStatus === 'PENDING') return 'Pendiente';
    if (upperStatus === 'COMPLETED') return 'Completado';
    if (upperStatus === 'FAILED') return 'Fallido';
    if (upperStatus === 'REFUNDED') return 'Reembolsado';
    return estado;
  }
};

export default paymentService;  