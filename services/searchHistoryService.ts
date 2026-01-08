import apiService from './apiService';

export interface SearchHistoryItem {
  id: string;
  terminoBusqueda?: string;
  precioMin?: number;
  precioMax?: number;
  anioMin?: number;
  anioMax?: number;
  marca?: string;
  transmision?: string;
  combustible?: string;
  fechaBusqueda: string;
  resultadosEncontrados: number;
}

class SearchHistoryService {
  async saveSearch(filters: {
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    minYear?: string;
    maxYear?: string;
    marca?: string;
    transmision?: string;
    combustible?: string;
  }, resultsCount: number = 0) {
    try {
      await apiService.post('/search-history', {
        terminoBusqueda: filters.search,
        precioMin: filters.minPrice ? parseInt(filters.minPrice) : undefined,
        precioMax: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
        anioMin: filters.minYear ? parseInt(filters.minYear) : undefined,
        anioMax: filters.maxYear ? parseInt(filters.maxYear) : undefined,
        marca: filters.marca,
        transmision: filters.transmision,
        combustible: filters.combustible,
        resultadosEncontrados: resultsCount,
      });
      console.log('✅ Búsqueda guardada en historial');
    } catch (error) {
      console.error('❌ Error saving search history:', error);
    }
  }

  async getMyHistory(limit: number = 20): Promise<SearchHistoryItem[]> {
    try {
      return await apiService.get(`/search-history/my-history?limit=${limit}`);
    } catch (error) {
      console.error('Error getting search history:', error);
      return [];
    }
  }

  async getRecentTerms(limit: number = 5): Promise<string[]> {
    try {
      return await apiService.get(`/search-history/recent-terms?limit=${limit}`);
    } catch (error) {
      console.error('Error getting recent terms:', error);
      return [];
    }
  }

  async getPopularSearches(limit: number = 10) {
    try {
      return await apiService.get(`/search-history/popular?limit=${limit}`);
    } catch (error) {
      console.error('Error getting popular searches:', error);
      return [];
    }
  }

  async getStats() {
    try {
      return await apiService.get('/search-history/stats');
    } catch (error) {
      console.error('Error getting search stats:', error);
      return null;
    }
  }

  async clearHistory() {
    try {
      await apiService.delete('/search-history/clear');
      console.log('✅ Historial eliminado');
    } catch (error) {
      console.error('Error clearing search history:', error);
      throw error;
    }
  }
}

export default new SearchHistoryService();
