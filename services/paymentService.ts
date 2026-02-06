import apiService from './apiService';
// Importamos tipos globales si existen, si no, usamos los locales definidos abajo
import { MechanicPayment } from '../types'; 

// --- Enum y Tipos Locales ---
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
  usuario?: any;
  // Agregamos campos opcionales para evitar errores de typescript en la UI
  created_at?: string; 
  mecanico_id?: string;
}

export interface InitiateWebpayResponse {
  token: string;
  url: string;
  amount: number;
  paymentId?: string; // ID interno de tu BD
}

// --- Configuración Visual ---
const STATUS_COLOR_MAP: Record<string, string> = {
  [PaymentStatus.COMPLETED]: '#4CAF50',
  [PaymentStatus.PENDING]: '#FF9800',
  [PaymentStatus.FAILED]: '#F44336',
  [PaymentStatus.REFUNDED]: '#2196F3',
  'CONFIRMADO': '#4CAF50', // Mapas extra por si el backend varía
  'INCOMPLETO': '#FF9800'
};

const PaymentService = {
  
  // 1. Obtener todos los pagos (Historial)
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

  // 2. Obtener pagos de mecánicos (CON TRADUCCIÓN DE TIPOS)
  async getMechanicPayouts(mechanicId: string): Promise<MechanicPayment[]> {
    try {
      const rawData = await apiService.fetch(`/payments/mechanic/${mechanicId}`, {
        method: 'GET',
        requiresAuth: true,
      });

      if (!rawData) return [];

      // Mapeo defensivo: Backend (camel) -> Frontend (snake)
      return rawData.map((item: any) => ({
        id: item.id,
        monto: Number(item.monto),
        fecha_pago: item.fechaCreacion || item.fecha_pago,
        nota: item.detalles || item.nota || 'Sin detalles',
        comprobante_url: item.comprobante_url || null,
        tipo: item.tipo || 'PAGO', 
        
        // Aquí arreglamos el error rojo de "Faltan propiedades"
        mecanico_id: item.usuario?.id || mechanicId,
        created_at: item.fechaCreacion || new Date().toISOString(),
        updated_at: item.fechaActualizacion || new Date().toISOString(),
        
        // Mapeo de estado para evitar undefined
        estado: item.estado || 'Pendiente'
      }));

    } catch (error) {
      console.error('Error fetching mechanic payouts:', error);
      return [];
    }
  },

  // 3. Iniciar Webpay (Llama a tu Backend Principal)
  async initiateWebpay(monto: number, usuarioId: string, detalles: string = 'Pago Servicio'): Promise<InitiateWebpayResponse> {
    try {
      console.log('Iniciando Webpay:', { monto, usuarioId });
      
      const response = await apiService.post('/payments/webpay/init', {
        monto,
        usuarioId,
        detalles,
        metodo: PaymentMethod.WEBPAY
      });
      
      // Verificación clave: Transbank necesita URL y Token
      if (!response.url || !response.token) {
        throw new Error('Respuesta inválida del servidor de pagos');
      }

      return response;
    } catch (error) {
      console.error('Error iniciando Webpay:', error);
      throw error;
    }
  },

  // 4. Resumen Financiero
  async getFinancialSummary() {
    try {
      return await apiService.fetch('/payments/summary/financial', {
        method: 'GET',
        requiresAuth: true,
      });
    } catch (error) {
      return { totalConfirmed: 0, totalUserBalance: 0, totalMechanicWithdrawals: 0 };
    }
  },

  // 5. Helpers Visuales
  formatCurrency(amount: number): string {
    if (amount === undefined || amount === null) return '$0';
    try {
      return '$' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    } catch {
      return `$${amount}`;
    }
  },

  getStatusColor(estado?: string): string {
    if (!estado) return '#999';
    // Normalizar a mayúsculas o capitalizado para buscar en el mapa
    const key = estado.toUpperCase();
    // Búsqueda flexible
    const found = Object.keys(STATUS_COLOR_MAP).find(k => k.toUpperCase() === key);
    return found ? STATUS_COLOR_MAP[found] : '#999';
  },

  getStatusLabel(estado?: string): string {
    return estado || 'Desconocido';
  }
};

export default PaymentService;