import { Alert } from 'react-native';
import apiService from './apiService';

// ==========================================
// 1. DEFINICIÓN DE TIPOS (Aquí arreglamos la "cagá")
// ==========================================

export enum PaymentStatus {
  PENDING = 'Pendiente',
  COMPLETED = 'Completado',
  FAILED = 'Fallido',
  REFUNDED = 'Reembolsado',
  REJECTED = 'Rechazado' // Agregado por si el backend lo envía
}

export enum PaymentMethod {
  WEBPAY = 'WebPay',
  TRANSFER = 'Transferencia',
  CASH = 'Efectivo',
  SALDO_AUTOBOX = 'Saldo AutoBox'
}

// Esta es la interfaz que necesita tu PaymentsScreen.tsx
export interface Payment {
  id: string;
  usuarioId: string;
  monto: number;
  estado: PaymentStatus | string;
  metodo: PaymentMethod | string;
  fechaCreacion: string;
  detalles?: string;
  // Datos opcionales que a veces vienen populados
  usuario?: {
    nombre: string;
    apellido: string;
    email: string;
  };
  // Datos técnicos de Webpay
  token?: string;
  idempotencyKey?: string;
  transactionDate?: string;
}

// Definimos esto aquí para no depender de '../types'
export interface MechanicPayment {
  id: string;
  mecanicoId: string;
  monto: number;
  nota?: string;
  comprobanteUrl?: string;
  fechaPago?: string;
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

// URL A FUEGO (Mantenida por seguridad de entorno)
const HARDCODED_PAYMENT_URL = 'https://payment-uby0.onrender.com';

const paymentService = {
  
  // ---------------------------------------------------------
  // 1. INICIAR PAGO WEBPAY (Lógica de Debug/Producción)
  // ---------------------------------------------------------
  
  async initiateWebPayTransaction(amount: number, buyOrder: string, sessionId: string): Promise<WebpayInitResponse> {
    console.log("🚀 1. INICIANDO PAGO...");
    const targetUrl = `${HARDCODED_PAYMENT_URL}/create`;
    
    try {
      // ENVIAMOS LAS VARIABLES DUPLICADAS (INGLÉS Y ESPAÑOL)
      const payload = {
        amount: amount,          // Inglés
        monto: amount,           // Español
        buyOrder: buyOrder,      // Inglés
        ordenCompra: buyOrder,   // Español
        sessionId: sessionId,    // Inglés
        idSesion: sessionId,     // Español
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

      // Normalización de respuesta
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
      // Evitamos doble alerta si ya la lanzamos arriba
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
      // Aseguramos que devuelva la estructura correcta aunque falle o venga vacío
      return response || { totalConfirmed: 0, totalUserBalance: 0, totalMechanicWithdrawals: 0 };
    } catch (error) {
      return { totalConfirmed: 0, totalUserBalance: 0, totalMechanicWithdrawals: 0 };
    }
  },

  // ---------------------------------------------------------
  // 3. GESTIÓN DE PAGOS A MECÁNICOS
  // ---------------------------------------------------------

  async getMechanicPayouts(mechanicId: string): Promise<MechanicPayment[]> {
    try {
      const response = await apiService.get(`/payments/mechanic/${mechanicId}`);
      return response || [];
    } catch (error) {
      console.error('Error obteniendo pagos del mecánico:', error);
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
        // TypeScript a veces reclama por el tipo de archivo en FormData, usamos 'any' para evitar bloqueo
        const fileToUpload: any = {
          uri: receiptImage.uri,
          type: 'image/jpeg', // O el tipo mime real si lo tienes
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