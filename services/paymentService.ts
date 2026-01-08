import apiService from './apiService';
import { Payment } from '../types';

// Original maps (kept human-readable)
const STATUS_API_MAP: Record<string, string> = {
  CONFIRMADO: 'Completado',
  COMPLETADO: 'Completado',
  INCOMPLETO: 'Pendiente',
  PENDIENTE: 'Pendiente',
  CANCELADO: 'Fallido',
  FALLIDO: 'Fallido',
  REEMBOLSADO: 'Reembolsado',
};

const STATUS_COLOR_MAP: Record<string, string> = {
  COMPLETADO: '#4CAF50',
  CONFIRMADO: '#4CAF50',
  PENDIENTE: '#FF9800',
  INCOMPLETO: '#FF9800',
  FALLIDO: '#F44336',
  CANCELADO: '#F44336',
  REEMBOLSADO: '#2196F3',
};

const STATUS_LABEL_MAP: Record<string, string> = {
  COMPLETADO: 'Completado',
  CONFIRMADO: 'Confirmado',
  PENDIENTE: 'Pendiente',
  INCOMPLETO: 'Pendiente',
  FALLIDO: 'Fallido',
  CANCELADO: 'Cancelado',
  REEMBOLSADO: 'Reembolsado',
};

const METHOD_LABEL_MAP: Record<string, string> = {
  WEBPAY: 'WebPay',
  TRANSFERENCIA: 'Transferencia',
  EFECTIVO: 'Efectivo',
  'SALDO AUTOBOX': 'Saldo AutoBox',
  SALDO_AUTOBOX: 'Saldo AutoBox',
  'DÉBITO': 'Débito',
};

function normalizeKey(s?: string): string | undefined {
  if (!s) return undefined;
  // Remove accents, convert non-alphanumerics to underscores, collapse underscores, trim, uppercase
  return s
    .normalize('NFD')
    .replace(/[\u0000-\u036f]/g, '')
    .replace(/[^A-Z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toUpperCase();
}

function makeNormalizedMap(obj: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of Object.keys(obj)) {
    const nk = normalizeKey(k);
    if (nk) out[nk] = obj[k];
  }
  return out;
}

const NORMALIZED_STATUS_API_MAP = makeNormalizedMap(STATUS_API_MAP);
const NORMALIZED_STATUS_COLOR_MAP = makeNormalizedMap(STATUS_COLOR_MAP);
const NORMALIZED_STATUS_LABEL_MAP = makeNormalizedMap(STATUS_LABEL_MAP);
const NORMALIZED_METHOD_LABEL_MAP = makeNormalizedMap(METHOD_LABEL_MAP);

class PaymentService {
  async getAllPayments(filters?: { estado?: string; month?: number; year?: number }): Promise<Payment[]> {
    try {
      const query = new URLSearchParams();
      if (filters?.estado) {
        const nk = normalizeKey(filters.estado);
        const mapped = nk ? NORMALIZED_STATUS_API_MAP[nk] ?? filters.estado : filters.estado;
        query.append('estado', mapped);
      }
      if (filters?.month) query.append('month', filters.month.toString());
      if (filters?.year) query.append('year', filters.year.toString());

      const url = query.toString() ? `/payments?${query.toString()}` : '/payments';
      const response = await apiService.fetch(url, {
        method: 'GET',
        requiresAuth: true,
      });
      return response;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    try {
      const response = await apiService.fetch(`/payments/user/${userId}`, {
        method: 'GET',
        requiresAuth: true,
      });
      return response;
    } catch (error) {
      console.error('Error fetching user payments:', error);
      throw error;
    }
  }

  async getPayment(id: string): Promise<Payment> {
    try {
      const response = await apiService.fetch(`/payments/${id}`, {
        method: 'GET',
        requiresAuth: true,
      });
      return response;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  }

  async updatePaymentStatus(id: string, estado: string): Promise<Payment> {
    try {
      const nk = normalizeKey(estado);
      const mapped = nk ? NORMALIZED_STATUS_API_MAP[nk] ?? estado : estado;
      const response = await apiService.fetch(`/payments/${id}/status`, {
        method: 'PATCH',
        requiresAuth: true,
        body: JSON.stringify({ estado: mapped }),
      });
      return response;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  formatCurrency(amount: number): string {
    try {
      const formatted = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
      // Remove locale currency code if present and keep leading $ for consistency
      return formatted.replace(/CLP\s?/, '').trim();
    } catch {
      return `$${amount.toLocaleString('es-CL')}`;
    }
  }

  getStatusColor(estado?: string): string {
    const nk = normalizeKey(estado);
    return nk ? NORMALIZED_STATUS_COLOR_MAP[nk] ?? '#999' : '#999';
  }

  getStatusLabel(estado?: string): string {
    const nk = normalizeKey(estado);
    return nk ? NORMALIZED_STATUS_LABEL_MAP[nk] ?? (estado || 'Desconocido') : (estado || 'Desconocido');
  }

  getMethodLabel(metodo?: string): string {
    const nk = normalizeKey(metodo);
    return nk ? NORMALIZED_METHOD_LABEL_MAP[nk] ?? (metodo || 'Desconocido') : (metodo || 'Desconocido');
  }
}

export default new PaymentService();
