import apiService from './apiService';

export interface BankAccount {
  id?: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  rut: string;
  fullName: string;
  email: string;
}

export interface RefundRequest {
  id: string;
  publicationId: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
}

const refundsService = {
  
  // Obtener cuenta bancaria guardada del usuario
  async getMyBankAccount(): Promise<BankAccount | null> {
    try {
      const response = await apiService.get('/refunds/bank-account');
      return response;
    } catch (error) {
      // Es normal que falle si el usuario nunca ha guardado una cuenta (404)
      // Devolvemos null para que la UI sepa que debe pedir los datos.
      console.log('Info: No se encontró cuenta bancaria (o error de red):', error);
      return null;
    }
  },

  // Guardar o actualizar cuenta bancaria
  async saveBankAccount(data: BankAccount): Promise<BankAccount> {
    try {
      const response = await apiService.post('/refunds/bank-account', data);
      return response;
    } catch (error) {
      console.error('Error guardando cuenta bancaria:', error);
      throw error;
    }
  },

  // Solicitar un reembolso
  async requestRefund(publicationId: string, reason: string): Promise<RefundRequest> {
    try {
      const response = await apiService.post('/refunds/request', { 
        publicationId, 
        reason 
      });
      return response;
    } catch (error) {
      console.error('Error solicitando reembolso:', error);
      throw error;
    }
  },
  
  // Obtener historial de reembolsos (Opcional, si tienes pantalla para esto)
  async getMyRefunds(): Promise<RefundRequest[]> {
      try {
          const response = await apiService.get('/refunds/my-requests'); // Ajustar endpoint si existe
          return response || [];
      } catch (error) {
          return [];
      }
  }
};

export default refundsService;