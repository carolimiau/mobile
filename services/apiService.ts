import { Platform } from 'react-native';
import authService from './authService';
import { Inspection, Vehicle, User } from '../types';
import { API_URL } from '../constants/Config';

class ApiService {
  async fetch(endpoint: string, options?: RequestInit & { requiresAuth?: boolean }) {
    try {
      const requiresAuth = options?.requiresAuth !== false;
      let token: string | null = null;

      console.log(`🔍 [API] Fetching ${endpoint}`);

      if (requiresAuth) {
        token = await authService.getToken();
        console.log(`🎫 [API] Token status:`, token ? `exists (${token.substring(0, 20)}...)` : 'MISSING');
        if (!token) {
          throw new Error('No authentication token found. Please login again.');
        }
      } else {
        console.log('🎫 [API] requiresAuth=false, skipping token');
      }

      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...((options as any)?.headers),
      };

      console.log(`📤 [API] Headers:`, { ...headers, Authorization: token ? 'Bearer ***' : undefined });

      // Add timeout to fetch
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 15000);
      });

      // Avoid passing our custom option to the native fetch
      const { requiresAuth: _r, ...restOptions } = (options as any) || {};

      const fetchPromise = fetch(`${API_URL}${endpoint}`, {
        ...restOptions,
        headers,
      });

      const response = await Promise.race([fetchPromise, timeout]) as Response;

      console.log(`📥 [API] Response status: ${response.status}`);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.error('🚪 [API] Session expired - logging out');
          // Importar router dinámicamente para evitar dependencias circulares
          const { router } = await import('expo-router');
          await authService.logout();
          router.replace('/auth');
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      // Verificar si hay contenido antes de parsear JSON
      const text = await response.text();

      // Si el texto está vacío o es solo espacios, retornar null
      if (!text || text.trim().length === 0) {
        return null;
      }

      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('❌ [API] Error parsing JSON response:', text);
        throw e;
      }
    } catch (error: any) {
      console.error(`❌ [API] Error en ${endpoint}:`, error.message);
      throw error;
    }
  }

  // Método POST genérico
  async post(endpoint: string, data?: any) {
    return this.fetch(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Método PUT genérico
  async put(endpoint: string, data?: any) {
    return this.fetch(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Método DELETE genérico
  async delete(endpoint: string) {
    return this.fetch(endpoint, {
      method: 'DELETE',
    });
  }

  // Método GET genérico
  async get(endpoint: string) {
    return this.fetch(endpoint, {
      method: 'GET',
    });
  }

  // Método PATCH genérico
  async patch(endpoint: string, data?: any) {
    return this.fetch(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Obtener vehículos del usuario autenticado
  async getMyVehicles(limit?: number, offset?: number): Promise<Vehicle[]> {
    try {
      const user = await authService.getUser();
      if (!user) return [];

      let url = `/vehicles/owner/${user.id}`;
      const params = [];
      if (limit !== undefined) params.push(`limit=${limit}`);
      if (offset !== undefined) params.push(`offset=${offset}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      return await this.fetch(url);
    } catch (error) {
      console.error('Error al obtener mis vehículos:', error);
      return [];
    }
  }

  // Obtener todos los vehículos
  async getAllVehicles(
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
    limit?: number,
    offset?: number
  ): Promise<Vehicle[]> {
    try {
      let url = '/vehicles';
      const params = [];
      if (sortBy) params.push(`sortBy=${sortBy}`);
      if (sortOrder) params.push(`sortOrder=${sortOrder}`);
      if (limit !== undefined) params.push(`limit=${limit}`);
      if (offset !== undefined) params.push(`offset=${offset}`);

      if (params.length > 0) url += `?${params.join('&')}`;

      return await this.fetch(url);
    } catch (error) {
      console.error('Error al obtener vehículos:', error);
      return [];
    }
  }

  // Buscar vehículos
  async searchVehicles(query: string): Promise<Vehicle[]> {
    try {
      return await this.fetch(`/vehicles/search?q=${encodeURIComponent(query)}`);
    } catch (error) {
      console.error('Error al buscar vehículos:', error);
      return [];
    }
  }

  // Obtener modelos por marca
  async getModelsByBrand(brand: string): Promise<string[]> {
    try {
      return await this.fetch(`/vehicles/models/${encodeURIComponent(brand)}`);
    } catch (error) {
      console.error('Error al obtener modelos:', error);
      return [];
    }
  }

  // Obtener años por marca y modelo
  async getYearsByBrandAndModel(brand: string, model: string): Promise<number[]> {
    try {
      return await this.fetch(`/vehicles/years/${encodeURIComponent(brand)}/${encodeURIComponent(model)}`);
    } catch (error) {
      console.error('Error al obtener años:', error);
      return [];
    }
  }

  // Obtener vehículos con inspección mecánica
  async getInspectedVehicles(): Promise<Vehicle[]> {
    try {
      // Por ahora retorna todos los vehículos, luego se puede filtrar por inspección
      const vehicles = await this.getAllVehicles();
      return vehicles.filter((v: any) => v.hasInspection); // Filtrar si existe el campo
    } catch (error) {
      console.error('Error al obtener vehículos inspeccionados:', error);
      return [];
    }
  }

  // Obtener vehículos recientes (últimos 10)
  async getLatestVehicles(limit: number = 10, offset: number = 0): Promise<Vehicle[]> {
    try {
      return await this.getAllVehicles('createdAt', 'DESC', limit, offset);
    } catch (error) {
      console.error('Error al obtener vehículos recientes:', error);
      return [];
    }
  }

  // Obtener usuario actual
  async getCurrentUser(): Promise<User | null> {
    try {
      return await authService.getUser();
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      return null;
    }
  }

  // Obtener perfil completo desde el backend
  async getProfile(): Promise<any> {
    try {
      return await this.fetch('/auth/profile');
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      throw error;
    }
  }

  // Actualizar perfil del usuario
  async updateProfile(userId: string, data: any): Promise<any> {
    try {
      const response = await this.fetch(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      // Actualizar usuario en AsyncStorage si es exitoso
      const user = await authService.getUser();
      if (user) {
        const updatedUser = { ...user, ...data };
        await authService.updateUser(updatedUser);
      }

      return response;
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      throw error;
    }
  }

  // Crear vehículo
  async createVehicle(vehicleData: any): Promise<Vehicle> {
    try {
      const user = await authService.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const data = {
        ...vehicleData,
        userId: user.id,
      };

      return await this.fetch('/vehicles', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error al crear vehículo:', error);
      throw error;
    }
  }

  // Crear publicación
  async createPublication(publicationData: any): Promise<any> {
    try {
      return await this.fetch('/publications', {
        method: 'POST',
        body: JSON.stringify(publicationData),
      });
    } catch (error) {
      console.error('Error al crear publicación:', error);
      throw error;
    }
  }

  // Obtener vehículo por ID
  async getVehicleById(id: string): Promise<Vehicle> {
    try {
      console.log('🔍 [ApiService] getVehicleById - ID:', id);
      console.log('🔍 [ApiService] URL completa:', `${API_URL}/vehicles/${id}`);
      const result = await this.fetch(`/vehicles/${id}`);
      console.log('✅ [ApiService] getVehicleById - Respuesta:', result);
      return result;
    } catch (error: any) {
      console.error('❌ [ApiService] Error al obtener vehículo:', error);
      console.error('❌ [ApiService] Error message:', error?.message);
      console.error('❌ [ApiService] Error response:', error?.response);
      throw error;
    }
  }

  // Consultar datos de vehículo por patente usando el backend
  async getVehicleDataByPlate(plate: string): Promise<any> {
    try {
      console.log('🔍 [ApiService] Consultando patente en backend:', plate);

      const result = await this.fetch(`/vehicles/api-data/${plate.toUpperCase()}`);

      console.log('✅ [ApiService] Datos obtenidos del backend:', JSON.stringify(result, null, 2));

      // Verificar si hay datos válidos (al menos marca y modelo)
      if (result && result.brand && result.model) {
        console.log('✅ [ApiService] Datos válidos encontrados');
        return {
          success: true,
          data: result
        };
      } else {
        console.log('⚠️ [ApiService] Datos incompletos o vacíos');
        return {
          success: false,
          message: 'No se encontraron datos completos para esta patente'
        };
      }
    } catch (error: any) {
      console.error('❌ [ApiService] Error al consultar patente:', error);

      return {
        success: false,
        message: error.message?.includes('404') || error.message?.includes('Not Found')
          ? 'No se encontraron datos para esta patente'
          : 'Error al consultar datos del vehículo'
      };
    }
  }

  // Actualizar vehículo
  async updateVehicle(id: string, data: any): Promise<Vehicle> {
    try {
      console.log('🔄 Actualizando vehículo:', id);
      console.log('📦 Datos a enviar:', JSON.stringify(data, null, 2));

      return await this.fetch(`/vehicles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error al actualizar vehículo:', error);
      throw error;
    }
  }

  // Eliminar vehículo
  async deleteVehicle(id: string): Promise<void> {
    try {
      await this.fetch(`/vehicles/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error al eliminar vehículo:', error);
      throw error;
    }
  }

  // Validar patente de vehículo (solo formato)
  async validateVehiclePlate(plate: string): Promise<{ valid: boolean; vehicle?: any; message?: string }> {
    try {
      const response = await this.fetch(`/vehicles/validate-plate/${plate}`);
      return response;
    } catch (error: any) {
      console.error('Error al validar patente:', error);
      // Validar formato localmente como fallback
      const plateRegex = /^[A-Z]{4}\d{2}$|^[A-Z]{2}\d{4}$/;
      if (plateRegex.test(plate.toUpperCase())) {
        return {
          valid: true,
          vehicle: { plate: plate.toUpperCase(), format: 'valid' }
        };
      }
      return {
        valid: false,
        message: 'Formato de patente inválido'
      };
    }
  }

  // Verificar si una patente está disponible para publicar
  async checkPlateAvailability(plate: string): Promise<{ available: boolean; message: string }> {
    try {
      const response = await this.get(`/publications/check-plate/${plate}`);
      return response;
    } catch (error: any) {
      console.error('Error al verificar disponibilidad de patente:', error);
      return {
        available: false,
        message: 'No se pudo verificar la disponibilidad de la patente'
      };
    }
  }

  // Desactivar una publicación
  async deactivatePublication(publicationId: string): Promise<{ success: boolean; message: string }> {
    return this.patch(`/publications/${publicationId}/deactivate`, {});
  }

  // Obtener marcas únicas de vehículos
  async getBrands(): Promise<string[]> {
    try {
      const vehicles = await this.getAllVehicles();
      const brands = [...new Set(vehicles.map((v: Vehicle) => v.marca))];
      return brands.sort();
    } catch (error) {
      console.error('Error al obtener marcas:', error);
      return [];
    }
  }

  // Formatear precio en CLP
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  }

  // Calcular tiempo transcurrido
  getTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    if (diffInDays < 30) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;

    const diffInMonths = Math.floor(diffInDays / 30);
    return `Hace ${diffInMonths} mes${diffInMonths > 1 ? 'es' : ''}`;
  }

  // Obtener horarios disponibles
  async getAvailableSlots(date: string, location?: string): Promise<{ id: number; time: string }[]> {
    try {
      let url = `/mechanics/available-slots?date=${date}`;
      if (location) {
        url += `&location=${encodeURIComponent(location)}`;
      }
      return await this.fetch(url);
    } catch (error) {
      console.error('Error al obtener horarios disponibles:', error);
      return [];
    }
  }

  // ==================== MÉTODOS DE INSPECCIONES ====================

  // Obtener todas las inspecciones
  async getAllInspections(): Promise<Inspection[]> {
    try {
      return await this.fetch('/inspections');
    } catch (error) {
      console.error('Error al obtener inspecciones:', error);
      return [];
    }
  }

  // Obtener inspecciones del usuario/mecánico autenticado
  async getMyInspections(params: any = {}): Promise<Inspection[]> {
    console.log('🔍 [API] getMyInspections - Inicio');
    const token = await authService.getToken();
    console.log('🎫 [API] Token status:', token ? `exists (${token.substring(0, 20)}...)` : 'NO existe');

    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    const url = `/inspections/my-inspections${queryString ? `?${queryString}` : ''}`;

    const result = await this.fetch(url);
    console.log('✅ [API] Respuesta recibida:', Array.isArray(result) ? `${result.length} inspecciones` : 'NO es array');

    return result;
  }

  // Obtener inspecciones de las publicaciones del usuario (como dueño del vehículo)
  async getMyPublicationsInspections(params: any = {}): Promise<Inspection[]> {
    console.log('🔍 [API] getMyPublicationsInspections - Inicio');

    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    const url = `/inspections/my-publications${queryString ? `?${queryString}` : ''}`;

    const result = await this.fetch(url);
    console.log('✅ [API] Respuesta recibida (publicaciones):', Array.isArray(result) ? `${result.length} inspecciones` : 'NO es array');
    return result || [];
  }

  // Obtener inspecciones por usuario
  async getInspectionsByUser(userId: string): Promise<Inspection[]> {
    try {
      return await this.fetch(`/inspections/user/${userId}`);
    } catch (error) {
      console.error('Error al obtener inspecciones del usuario:', error);
      return [];
    }
  }

  // Obtener inspecciones por vehículo (patente)
  async getInspectionsByVehicle(vehicleId: string): Promise<Inspection[]> {
    try {
      return await this.fetch(`/inspections/vehicle/${vehicleId}`);
    } catch (error) {
      console.error('Error al obtener inspecciones del vehículo:', error);
      return [];
    }
  }

  // Buscar inspecciones por patente de vehículo
  async searchInspectionsByPlate(plate: string): Promise<Inspection[]> {
    try {
      // Primero buscar el vehículo por patente
      const vehicles = await this.searchVehicles(plate);
      if (vehicles.length === 0) {
        return [];
      }

      // Obtener todas las inspecciones de esos vehículos
      const inspectionsPromises = vehicles.map(vehicle =>
        this.getInspectionsByVehicle(vehicle.id)
      );
      const inspectionsArrays = await Promise.all(inspectionsPromises);

      // Aplanar el array y agregar información del vehículo
      return inspectionsArrays.flat().map((inspection, index) => ({
        ...inspection,
        vehicle: vehicles[Math.floor(index / vehicles.length)]
      }));
    } catch (error) {
      console.error('Error al buscar inspecciones por patente:', error);
      return [];
    }
  }

  // Obtener inspección por ID
  async getInspectionById(id: string): Promise<Inspection | null> {
    try {
      return await this.fetch(`/inspections/${id}`);
    } catch (error) {
      console.error('Error al obtener inspección:', error);
      return null;
    }
  }

  // Crear nueva inspección
  async createInspection(data: any): Promise<Inspection> {
    try {
      return await this.fetch('/inspections', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error al crear inspección:', error);
      throw error;
    }
  }

  // Actualizar inspección
  async updateInspection(id: string, data: Partial<Inspection>): Promise<Inspection> {
    try {
      return await this.fetch(`/inspections/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error al actualizar inspección:', error);
      throw error;
    }
  }

  // Formatear fecha en formato español
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Obtener color según estado de inspección
  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'completed': '#4CAF50',
      'published': '#4CAF50', // Verde para publicado
      'publish': '#4CAF50',   // Verde para publish (backend legacy)
      'available': '#4CAF50', // Verde para disponible
      'pending': '#2196F3',
      'in-progress': '#FF9800',
      'cancelled': '#F44336',
      'sold': '#9E9E9E',      // Gris para vendido
    };
    return statusColors[status.toLowerCase()] || '#8E8E93';
  }

  // Obtener texto en español del estado
  getStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'completed': 'Completado',
      'published': 'Disponible',
      'publish': 'Disponible',
      'publicada': 'Disponible',
      'publicada_verificada': 'Verificada',
      'available': 'Disponible',
      'pending': 'Pendiente',
      'in-progress': 'En Proceso',
      'cancelled': 'Cancelado',
      'searching_mechanic': 'Buscando mecánico',
      'inspection_pending': 'Inspección pendiente',
      'sold': 'Vendido',
    };
    return statusTexts[status.toLowerCase()] || status;
  }

  // ==================== MÉTODOS DE BÚSQUEDA ====================

  // Buscar vehículos por texto (marca, modelo, descripción)
  async searchVehiclesByQuery(query: string, sortBy?: string, sortOrder?: 'ASC' | 'DESC'): Promise<Vehicle[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }
      let url = `/search?q=${encodeURIComponent(query.trim())}`;
      if (sortBy) {
        url += `&sortBy=${sortBy}&sortOrder=${sortOrder || 'DESC'}`;
      }
      return await this.fetch(url);
    } catch (error) {
      console.error('Error al buscar vehículos:', error);
      return [];
    }
  }

  // Obtener historial de búsquedas del usuario
  async getSearchHistory(limit: number = 10): Promise<{
    query: string;
    timestamp: number;
    resultCount?: number;
    filters?: any;
  }[]> {
    try {
      return await this.fetch(`/search/history?limit=${limit}`);
    } catch (error) {
      console.error('Error al obtener historial de búsqueda:', error);
      return [];
    }
  }

  // Limpiar todo el historial de búsquedas
  async clearSearchHistory(): Promise<void> {
    try {
      await this.delete('/search/history');
    } catch (error) {
      console.error('Error al limpiar historial:', error);
      throw error;
    }
  }

  // Eliminar una búsqueda específica del historial
  async removeSearchFromHistory(query: string): Promise<void> {
    try {
      await this.delete(`/search/history/${encodeURIComponent(query)}`);
    } catch (error) {
      console.error('Error al eliminar búsqueda:', error);
      throw error;
    }
  }

  // Obtener sugerencias de búsqueda
  async getSearchSuggestions(prefix: string, limit: number = 5): Promise<string[]> {
    try {
      if (!prefix || prefix.trim().length === 0) {
        return [];
      }
      return await this.fetch(`/search/suggestions?q=${encodeURIComponent(prefix.trim())}&limit=${limit}`);
    } catch (error) {
      console.error('Error al obtener sugerencias:', error);
      return [];
    }
  }

  // Obtener búsquedas populares
  async getPopularSearches(limit: number = 10): Promise<{ query: string; count: number }[]> {
    try {
      return await this.fetch(`/search/popular?limit=${limit}`);
    } catch (error) {
      console.error('Error al obtener búsquedas populares:', error);
      return [];
    }
  }

  // Obtener publicaciones con filtros (Server-side)
  async getPublications(filters: any = {}) {
    try {
      const queryParams = new URLSearchParams();

      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '' && filters[key] !== null) {
          queryParams.append(key, filters[key].toString());
        }
      });

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/publications?${queryString}` : '/publications';

      const publications = await this.get(endpoint);

      console.log('Raw publication sample:', publications[0]);

      // Map publications to vehicles format expected by UI
      return publications.map((pub: any) => {
        const mapped = {
          ...pub.vehiculo,
          publicationId: pub.id,
          images: pub.fotos?.map((f: any) => f.url) || [],
          price: pub.vehiculo?.valor || pub.valor,
          valor: pub.vehiculo?.valor || pub.valor,
          videoUrl: pub.videoUrl,
          // Ensure we have all necessary fields
          marca: pub.vehiculo?.marca,
          modelo: pub.vehiculo?.modelo,
          anio: pub.vehiculo?.anio,
          kilometraje: pub.vehiculo?.kilometraje,
          comuna: pub.vehiculo?.comuna,
          region: pub.vehiculo?.region,
          transmision: pub.vehiculo?.transmision,
          tipoCombustible: pub.vehiculo?.tipoCombustible,
          user: pub.vendedor,
          estado: pub.estado
        };
        console.log('Mapped vehicle:', mapped.id, 'valor:', mapped.valor, 'price:', mapped.price);
        return mapped;
      });
    } catch (error) {
      console.error('Error fetching publications:', error);
      throw error;
    }
  }

  // Obtener vehículos favoritos del usuario autenticado
  async getFavorites(limit?: number, offset?: number) {
    try {
      let url = '/publications/favorites';
      const params = [];
      if (limit !== undefined) params.push(`limit=${limit}`);
      if (offset !== undefined) params.push(`offset=${offset}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const favorites = await this.get(url);
      // Backend already returns mapped vehicle-like objects.
      // In case backend returns Publication objects, ensure mapping here.
      return (favorites || []).map((item: any) => ({
        ...item?.vehiculo ? item.vehiculo : item,
        publicationId: item.publicationId ?? item.id,
        images: item.images ?? (item.fotos?.map((f: any) => f.url) || []),
        valor: item.valor ?? item?.vehiculo?.valor,
        price: item.price ?? item?.vehiculo?.valor,
        videoUrl: item.videoUrl,
        marca: item.marca ?? item?.vehiculo?.marca,
        modelo: item.modelo ?? item?.vehiculo?.modelo,
        anio: item.anio ?? item?.vehiculo?.anio,
        kilometraje: item.kilometraje ?? item?.vehiculo?.kilometraje,
        comuna: item.comuna ?? item?.vehiculo?.comuna,
        region: item.region ?? item?.vehiculo?.region,
        transmision: item.transmision ?? item?.vehiculo?.transmision,
        tipoCombustible: item.tipoCombustible ?? item?.vehiculo?.tipoCombustible,
        user: item.user ?? item?.vendedor,
        estado: item.estado,
        id: (item?.vehiculo?.id) || item.id,
      }));
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  }

  // Buscar vehículos con filtros avanzados
  async searchVehiclesWithFilters(filters: {
    query?: string;
    brand?: string;
    model?: string;
    priceMin?: number;
    priceMax?: number;
    yearMin?: number;
    yearMax?: number;
    kilometersMin?: number;
    kilometersMax?: number;
    fuelType?: string;
    transmission?: string;
    location?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<Vehicle[]> {
    try {
      // Obtener todos los vehículos primero (ordenados desde el backend)
      let vehicles = await this.getAllVehicles(filters.sortBy, filters.sortOrder);

      // Aplicar filtros localmente
      if (filters.query && filters.query.trim()) {
        const queryLower = filters.query.toLowerCase();
        vehicles = vehicles.filter(v =>
          v.marca.toLowerCase().includes(queryLower) ||
          v.modelo.toLowerCase().includes(queryLower) ||
          (v.descripcion && v.descripcion.toLowerCase().includes(queryLower))
        );
      }

      if (filters.brand) {
        vehicles = vehicles.filter(v =>
          v.marca.toLowerCase() === filters.brand!.toLowerCase()
        );
      }

      if (filters.model) {
        vehicles = vehicles.filter(v =>
          v.modelo.toLowerCase().includes(filters.model!.toLowerCase())
        );
      }

      if (filters.priceMin !== undefined) {
        vehicles = vehicles.filter(v => (v.valor || 0) >= filters.priceMin!);
      }

      if (filters.priceMax !== undefined) {
        vehicles = vehicles.filter(v => (v.valor || 0) <= filters.priceMax!);
      }

      if (filters.yearMin !== undefined) {
        vehicles = vehicles.filter(v => v.anio >= filters.yearMin!);
      }

      if (filters.yearMax !== undefined) {
        vehicles = vehicles.filter(v => v.anio <= filters.yearMax!);
      }

      if (filters.kilometersMin !== undefined) {
        vehicles = vehicles.filter(v => (v.kilometraje || 0) >= filters.kilometersMin!);
      }

      if (filters.kilometersMax !== undefined) {
        vehicles = vehicles.filter(v => (v.kilometraje || 0) <= filters.kilometersMax!);
      }

      if (filters.fuelType) {
        vehicles = vehicles.filter(v =>
          v.tipoCombustible && v.tipoCombustible.toLowerCase() === filters.fuelType!.toLowerCase()
        );
      }

      if (filters.transmission) {
        vehicles = vehicles.filter(v =>
          v.transmision && v.transmision.toLowerCase() === filters.transmission!.toLowerCase()
        );
      }

      if (filters.location) {
        vehicles = vehicles.filter(v =>
          (v.comuna && v.comuna.toLowerCase().includes(filters.location!.toLowerCase())) ||
          (v.region && v.region.toLowerCase().includes(filters.location!.toLowerCase()))
        );
      }

      return vehicles;
    } catch (error) {
      console.error('Error al buscar vehículos con filtros:', error);
      return [];
    }
  }

  // ==================== NOTIFICACIONES ====================

  /**
   * Obtener todas las notificaciones del usuario
   */
  async getNotifications(limit: number = 50): Promise<any[]> {
    try {
      return await this.get(`/notifications?limit=${limit}`);
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      return [];
    }
  }

  /**
   * Obtener notificaciones no leídas
   */
  async getUnreadNotifications(): Promise<any[]> {
    try {
      return await this.get('/notifications/unread');
    } catch (error) {
      console.error('Error al obtener notificaciones no leídas:', error);
      return [];
    }
  }

  /**
   * Contar notificaciones no leídas
   */
  async getUnreadNotificationsCount(): Promise<number> {
    try {
      const result = await this.get('/notifications/unread/count');
      return result.count || 0;
    } catch (error) {
      console.error('Error al contar notificaciones no leídas:', error);
      return 0;
    }
  }

  /**
   * Actualizar token de push notificaciones
   */
  async updatePushToken(userId: string, pushToken: string) {
    try {
      console.log(`📡 [API] Updating push token for user ${userId}`);
      await this.post(`/users/${userId}/push-token`, { pushToken });
    } catch (error) {
      console.error('Error updating push token:', error);
    }
  }


  /**
   * Marcar una notificación como leída
   */
  async markNotificationAsRead(notificationId: string): Promise<any> {
    try {
      return await this.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      throw error;
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllNotificationsAsRead(): Promise<void> {
    try {
      await this.patch('/notifications/read-all');
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      throw error;
    }
  }

  /**
   * Eliminar una notificación
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await this.delete(`/notifications/${notificationId}`);
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      throw error;
    }
  }

  // ==================== VISTAS Y LIKES DE VEHÍCULOS ====================

  /**
   * Registrar vista de un vehículo
   */
  async registerVehicleView(vehicleId: string): Promise<any> {
    try {
      return await this.post(`/vehicles/${vehicleId}/view`);
    } catch (error) {
      console.error('Error al registrar vista:', error);
      throw error;
    }
  }

  /**
   * Dar like a un vehículo
   */
  async likeVehicle(vehicleId: string): Promise<any> {
    try {
      return await this.post(`/vehicles/${vehicleId}/like`);
    } catch (error) {
      console.error('Error al dar like:', error);
      throw error;
    }
  }

  /**
   * Quitar like de un vehículo
   */
  async unlikeVehicle(vehicleId: string): Promise<any> {
    try {
      return await this.delete(`/vehicles/${vehicleId}/like`);
    } catch (error) {
      console.error('Error al quitar like:', error);
      throw error;
    }
  }

  /**
   * Obtener vehículos favoritos del usuario actual
   */
  async getLikedVehicles(limit?: number, offset?: number): Promise<Vehicle[]> {
    try {
      const user = await authService.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      let url = `/vehicles/liked/user/${user.id}`;
      const params = [];
      if (limit !== undefined) params.push(`limit=${limit}`);
      if (offset !== undefined) params.push(`offset=${offset}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      return await this.get(url);
    } catch (error) {
      console.error('Error al obtener vehículos favoritos:', error);
      throw error;
    }
  }

  // ==================== SEDES ====================

  /**
   * getSedes - Obtiene la lista de sedes disponibles.
   * No requiere parámetros.
   * Retorna un arreglo de sedes con id, nombre y direccion.
   * Llama a GET /sedes y retorna array vacío si falla.
   */
  async getSedes(): Promise<{ id: number; nombre: string; direccion: string }[]> {
    try {
      return await this.get('/sedes');
    } catch (error) {
      console.error('Error al obtener sedes:', error);
      return [];
    }
  }

  // ==================== WEBPAY PAYMENT METHODS ====================

  /**
   * Obtener precios de servicios
   */
  async getPrices(): Promise<{ id: number; nombre: string; precio: number }[]> {
    return await this.get('/payments/prices');
  }

  /**
   * Crear transacción de WebPay
   */
  async createWebPayTransaction(data: {
    inspectionId?: string; // Ahora es opcional
    paymentId?: string; // UUID del pago creado en backend
    amount: number;
    returnUrl: string;
  }): Promise<any> {
    try {
      return await this.post('/payments/webpay/create', data);
    } catch (error) {
      console.error('Error al crear transacción WebPay:', error);
      throw error;
    }
  }

  /**
   * Confirmar transacción de WebPay
   */
  async confirmWebPayTransaction(token: string): Promise<any> {
    try {
      return await this.post('/payments/webpay/confirm', { token_ws: token });
    } catch (error) {
      console.error('Error al confirmar transacción WebPay:', error);
      throw error;
    }
  }

  /**
   * Obtener estado de transacción WebPay
   */
  async getWebPayTransactionStatus(token: string): Promise<any> {
    try {
      return await this.get(`/payments/webpay/status?token=${token}`);
    } catch (error) {
      console.error('Error al obtener estado de transacción WebPay:', error);
      throw error;
    }
  }

  // ==================== CHAT ====================

  async getChats(): Promise<any[]> {
    try {
      return await this.fetch('/chat/conversations');
    } catch (error) {
      console.error('Error getting chats:', error);
      return [];
    }
  }

  async getMessages(chatId: string): Promise<any[]> {
    try {
      return await this.fetch(`/chat/conversation/${chatId}`);
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  async sendMessage(chatId: string, content: string): Promise<any> {
    try {
      const user = await authService.getUser();
      if (!user) throw new Error('User not authenticated');

      return await this.fetch('/chat/messages', {
        method: 'POST',
        body: JSON.stringify({
          remitenteId: user.id,
          destinatarioId: chatId,
          mensaje: content
        })
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async markConversationAsRead(otherUserId: string): Promise<void> {
    try {
      await this.fetch(`/chat/conversation/${otherUserId}/read`, {
        method: 'PATCH',
      });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      // Fail silently to not disrupt UI
    }
  }
}

export default new ApiService();
