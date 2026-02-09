import { Alert } from 'react-native';
import apiService from './apiService';
import { MechanicPayment } from '../types';

// --- TUS ENUMS Y TIPOS IGUALES ---
export enum PaymentStatus { PENDING = 'Pendiente', COMPLETED = 'Completado', FAILED = 'Fallido', REFUNDED = 'Reembolsado' }
export enum PaymentMethod { WEBPAY = 'WebPay', TRANSFER = 'Transferencia', CASH = 'Efectivo', SALDO_AUTOBOX = 'Saldo AutoBox' }

// URL A FUEGO (Para descartar errores de entorno)
const HARDCODED_PAYMENT_URL = 'https://payment-uby0.onrender.com';

const paymentService = {
  
  // ==========================================
  // 1. INICIAR PAGO WEBPAY (CORREGIDO ESPAÑOL/INGLÉS)
  // ==========================================
  
  async initiateWebPayTransaction(amount: number, buyOrder: string, sessionId: string): Promise<any> {
    console.log("🚀 1. INICIANDO PAGO...");
    const targetUrl = `${HARDCODED_PAYMENT_URL}/create`;
    
    try {
      // ENVIAMOS LAS VARIABLES DUPLICADAS (INGLÉS Y ESPAÑOL)
      // Así le achuntamos sí o sí a lo que espere tu backend.
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
          'Accept': 'application/json' // Importante para que no devuelva HTML
        },
        body: JSON.stringify(payload),
      });

      console.log("📡 2. Status del Servidor:", response.status);

      // Si el servidor falla
      if (!response.ok) {
        const text = await response.text();
        Alert.alert("Error del Servidor", `Status: ${response.status}\nMensaje: ${text}`);
        throw new Error(`Server Error: ${response.status}`);
      }

      // Leemos la respuesta
      const responseText = await response.text();
      console.log("📩 3. Respuesta RAW:", responseText);

      // Intentamos convertir a JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        Alert.alert("Error Formato", "El servidor no devolvió JSON:\n" + responseText.substring(0, 100));
        throw new Error("Invalid JSON response");
      }

      // BUSCAMOS LA URL DONDE SEA QUE ESTÉ
      // A veces viene en data.url, a veces en data.response.url, a veces data.data.url
      const webpayUrl = data.url || data.response?.url || data.data?.url;
      const webpayToken = data.token || data.response?.token || data.data?.token;

      if (webpayUrl && webpayToken) {
        // Normalizamos la respuesta para tu App
        return { url: webpayUrl, token: webpayToken };
      } else {
        Alert.alert("Faltan Datos", `Recibimos esto:\n${JSON.stringify(data)}`);
        throw new Error("No URL in response");
      }

    } catch (error: any) {
      console.error("❌ ERROR FINAL:", error);
      Alert.alert("Error al cargar WebPay", error.message);
      throw error;
    }
  },

  // ... (RESTO DE FUNCIONES IGUAL QUE SIEMPRE)
  async getAllPayments() { try { return await apiService.get('/payments') || []; } catch(e){ return []; } },
  async getPaymentsByUser(id: string) { try { return await apiService.get(`/payments/user/${id}`) || []; } catch(e){ return []; } },
  async updatePaymentStatus(id: string, st: PaymentStatus) { return apiService.patch(`/payments/${id}/status`, { estado: st }); },
  async getFinancialSummary() { try { return await apiService.get('/payments/summary/financial'); } catch(e){ return {totalConfirmed:0, totalUserBalance:0, totalMechanicWithdrawals:0}; } },
  async getMechanicPayouts(id: string) { try { return await apiService.get(`/payments/mechanic/${id}`) || []; } catch(e){ return []; } },
  
  async registerMechanicPayout(mechanicId: string, amount: string, note: string, receiptImage: any) {
    const formData = new FormData();
    formData.append('mecanicoId', mechanicId);
    formData.append('monto', amount);
    formData.append('nota', note || '');
    if (receiptImage) {
      formData.append('comprobante', {
        uri: receiptImage.uri,
        type: 'image/jpeg',
        name: receiptImage.fileName || `receipt-${Date.now()}.jpg`,
      } as any);
    }
    return apiService.post('/payments/mechanic', formData);
  },

  async deleteMechanicPayout(id: number) { await apiService.delete(`/payments/mechanic/${id}`); },
  
  formatCurrency(amount: number|string) { return '$' + (typeof amount==='string'?parseFloat(amount):amount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, "."); },
  getStatusColor(s?:string) { return s?.includes('COMPLET')?'#4CAF50': s?.includes('PEND')?'#FF9800': '#999'; },
  getStatusLabel(s?:string) { return s||''; }
};

export default paymentService;