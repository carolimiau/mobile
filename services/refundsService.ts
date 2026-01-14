import apiService from './apiService';

export interface BankAccount {
  id: string;
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
  async getMyBankAccount(): Promise<BankAccount | null> {
    try {
      const response = await apiService.get('/refunds/bank-account');
      return response;
    } catch (error) {
      console.log('Error fetching bank account (might be empty):', error);
      return null;
    }
  },

  async saveBankAccount(data: Partial<BankAccount>): Promise<BankAccount> {
    const response = await apiService.post('/refunds/bank-account', data);
    return response;
  },

  async requestRefund(publicationId: string, reason: string): Promise<RefundRequest> {
    const response = await apiService.post('/refunds/request', { publicationId, reason });
    return response;
  },
};

export default refundsService;
