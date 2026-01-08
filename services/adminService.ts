import { Platform } from 'react-native';
import authService from './authService';
import apiService from './apiService';
import { API_URL } from '../constants/Config';

const GETAPI_URL = 'https://chile.getapi.cl/v1/vehicles/plate';
const GETAPI_KEY = 'c579f6db-6468-43ea-98f1-d7782a334f16';

export interface Mechanic {
  id: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  phone: string;
  specialization?: string;
  status: 'active' | 'inactive';
  rating?: number;
  completedInspections?: number;
  pendingInspections?: number;
  inspectionsCompleted?: number;
  certificateUrl?: string;
  createdAt: string;
  module?: string;
  currentBalance?: number;
  pendingPayments?: number;
  schedules?: MechanicSchedule[];
  profilePhoto?: string;
}

export interface MechanicSchedule {
  id: string;
  mechanicId: string;
  dayOfWeek: number;
  timeSlots: string[];
  isActive: boolean;
}

export interface UpdateScheduleDto {
  schedules: {
    dayOfWeek: number;
    timeSlots: string[];
    isActive?: boolean;
  }[];
}

export interface AdminInspection {
  id: string;
  inspectionNumber: string;
  vehicleId: string;
  vehiclePatent?: string;
  vehicleBrand: string;
  vehicleModel: string;
  mechanicId?: string;
  mechanicName?: string;
  mechanicPhoto?: string;
  mechanic?: any;
  status: string;
  scheduledDate: string;
  createdAt: string;
  updatedAt?: string;
  completedDate?: string;
  price?: number;
  paymentStatus?: string;
  mechanicCommission?: number;
  cancellationReason?: string;
  observacion?: string;
}

export interface DashboardStats {
  totalInspections: number;
  pendingInspections: number;
  completedInspections: number;
  totalPayments: number;
  pendingPayments: number;
  completedPayments: number;
  totalVehicles: number;
  activePublications: number;
  totalMechanics: number;
  activeMechanics: number;
}

export interface GlobalSettings {
  pricing: {
    inspectionPrice: number;
    publicationPrice: number;
  };
}

class AdminService {
  private async getHeaders() {
    const token = await authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private async getMultipartHeaders() {
    const token = await authService.getToken();
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  async notifyAdmins(title: string, message: string, metadata?: any, types?: string[]) {
    try {
      console.log('🔔 [AdminService] notifyAdmins called');
      const response = await apiService.post('/notifications/notify-admins', {
        title,
        message,
        metadata,
        types
      });
      console.log('✅ [AdminService] Response data:', response);
      return response;
    } catch (error) {
      console.error('❌ [AdminService] Error notifying admins:', error);
    }
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/admin/dashboard/stats`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Error al obtener estadísticas');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getDashboardStats:', error);
      throw error;
    }
  }

  // Configuración Global
  async getGlobalSettings(): Promise<GlobalSettings> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/admin/settings`, {
        headers,
      });

      if (!response.ok) {
        console.warn('No se pudo obtener configuración, usando valores por defecto');
        return {
          pricing: {
            inspectionPrice: 40000,
            publicationPrice: 25000
          }
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Error getGlobalSettings:', error);
      return {
        pricing: {
          inspectionPrice: 25000,
          publicationPrice: 5000
        }
      };
    }
  }

  async updateGlobalSettings(settings: GlobalSettings): Promise<GlobalSettings> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/admin/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar configuración');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updateGlobalSettings:', error);
      throw error;
    }
  }

  // Mecánicos
  async getAllMechanics(search?: string, date?: string, time?: string): Promise<Mechanic[]> {
    try {
      const headers = await this.getHeaders();
      let url = `${API_URL}/admin/mechanics`;
      
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (date) params.append('date', date);
      if (time) params.append('time', time);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Error al obtener mecánicos');
      }

      const data = await response.json();
      // El backend retorna { mechanics: [...], total: number }
      // Extraer solo el array de mecánicos
      return data.mechanics || data || [];
    } catch (error) {
      console.error('Error getAllMechanics:', error);
      throw error;
    }
  }

  async searchMechanics(search: string): Promise<Mechanic[]> {
    return this.getAllMechanics(search);
  }

  async getMechanicById(id: string): Promise<Mechanic> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/admin/mechanics/${id}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Error al obtener mecánico');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getMechanicById:', error);
      throw error;
    }
  }

  async createMechanic(data: {
    firstName: string;
    lastName: string;
    rut: string;
    email: string;
    phone: string;
    password: string;
    specialization?: string;
    nationality?: string;
    commune?: string;
    address?: string;
    profilePhoto?: string;
  }): Promise<Mechanic> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/admin/mechanics`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al crear mecánico');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error createMechanic:', error);
      throw error;
    }
  }

  async updateMechanic(id: string, data: Partial<Mechanic>): Promise<Mechanic> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/admin/mechanics/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar mecánico');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updateMechanic:', error);
      throw error;
    }
  }

  async deleteMechanic(id: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/admin/mechanics/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Error al eliminar mecánico');
      }
    } catch (error) {
      console.error('Error deleteMechanic:', error);
      throw error;
    }
  }

  async toggleMechanicStatus(id: string): Promise<Mechanic> {
    try {
      console.log('📡 Llamando a toggle status para mecánico:', id);
      console.log('📍 URL:', `${API_URL}/admin/mechanics/${id}/toggle-status`);
      
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/admin/mechanics/${id}/toggle-status`, {
        method: 'PATCH',
        headers,
      });

      console.log('📥 Respuesta del servidor:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error('Error al cambiar estado del mecánico');
      }

      const data = await response.json();
      console.log('✅ Datos recibidos:', data);
      return data;
    } catch (error) {
      console.error('❌ Error toggleMechanicStatus:', error);
      throw error;
    }
  }

  async uploadMechanicCertificate(mechanicId: string, fileUri: string): Promise<{ url: string }> {
    try {
      // 1. Obtener URL pre-firmada para subir
      const filename = fileUri.split('/').pop() || 'certificate.pdf';
      const fileKey = `mechanics/${mechanicId}/certificates/${Date.now()}_${filename}`;
      
      const presignedResponse = await fetch(`${API_URL}/uploads/presigned-upload`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify({
          fileName: filename,
          fileType: 'application/pdf',
          folder: `mechanics/${mechanicId}/certificates`,
        }),
      });

      if (!presignedResponse.ok) {
        throw new Error('Error al generar URL de subida');
      }

      const { uploadUrl, key } = await presignedResponse.json();

      // 2. Subir archivo a S3 usando la URL pre-firmada
      const fileBlob = await fetch(fileUri).then(r => r.blob());
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: fileBlob,
        headers: {
          'Content-Type': 'application/pdf',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Error al subir el archivo a S3');
      }

      // 3. Notificar al backend que el certificado fue subido
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/admin/mechanics/${mechanicId}/certificate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ fileKey: key }),
      });

      if (!response.ok) {
        throw new Error('Error al registrar certificado');
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploadMechanicCertificate:', error);
      throw error;
    }
  }

  async uploadMechanicProfilePhoto(mechanicId: string, fileUri: string): Promise<string> {
    try {
      const filename = fileUri.split('/').pop() || 'profile.jpg';
      const folder = `mechanics/${mechanicId}/profile`;
      
      // 1. Obtener URL pre-firmada
      const presignedResponse = await fetch(`${API_URL}/uploads/presigned-upload`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify({
          fileName: filename,
          fileType: 'image/jpeg', // Asumimos jpeg por simplicidad
          folder: folder,
        }),
      });

      if (!presignedResponse.ok) {
        throw new Error('Error al generar URL de subida');
      }

      const { uploadUrl, publicUrl } = await presignedResponse.json();

      // 2. Subir archivo a S3
      const fileBlob = await fetch(fileUri).then(r => r.blob());
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: fileBlob,
        headers: {
          'Content-Type': 'image/jpeg',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Error al subir la imagen a S3');
      }

      return publicUrl;
    } catch (error) {
      console.error('Error uploadMechanicProfilePhoto:', error);
      throw error;
    }
  }

  async getMechanicSchedule(mechanicId: string): Promise<MechanicSchedule[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/admin/mechanics/${mechanicId}/schedule`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Error al obtener horario del mecánico');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getMechanicSchedule:', error);
      throw error;
    }
  }

  async updateMechanicSchedule(mechanicId: string, data: UpdateScheduleDto): Promise<MechanicSchedule[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/admin/mechanics/${mechanicId}/schedule`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar horario del mecánico');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updateMechanicSchedule:', error);
      throw error;
    }
  }

  async getSedeSchedule(sedeId: number) {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/admin/sedes/${sedeId}/schedule`, {
        headers,
      });
      if (!response.ok) throw new Error('Error fetching sede schedule');
      return await response.json();
    } catch (error) {
      console.error('Error getSedeSchedule:', error);
      throw error;
    }
  }

  async updateSedeSchedule(sedeId: number, data: UpdateScheduleDto) {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/admin/sedes/${sedeId}/schedule`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error updating sede schedule');
      return await response.json();
    } catch (error) {
      console.error('Error updateSedeSchedule:', error);
      throw error;
    }
  }

  // Inspections
  async getRecentInspections(limit: number = 10): Promise<AdminInspection[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/admin/inspections/recent?limit=${limit}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Error al obtener inspecciones');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getRecentInspections:', error);
      throw error;
    }
  }

  async getAllInspections(params: any = {}): Promise<AdminInspection[]> {
    try {
      const headers = await this.getHeaders();
      // Construir query string
      const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
      
      const url = `${API_URL}/inspections${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Error al obtener inspecciones');
      }

      const data = await response.json();
      console.log('📋 Datos crudos de inspecciones:', JSON.stringify(data, null, 2));
      
      // Transformar datos y retornar con marcadores de carga
      const inspections = data.map((inspection: any) => {
        const mechanic = inspection.mecanico || inspection.mechanic;
        return {
          id: inspection.id,
          inspectionNumber: inspection.inspectionNumber || `INS-${inspection.id?.slice(0, 8)}`,
          vehicleId: inspection.vehicleId || inspection.vehicle?.id || inspection.publicacion?.vehiculo?.id,
          vehiclePatent: inspection.vehicle?.patent || inspection.vehiclePatent || inspection.publicacion?.vehiculo?.patente,
          vehicleBrand: inspection.vehicle?.brand || inspection.vehicleBrand || inspection.publicacion?.vehiculo?.marca || null,
          vehicleModel: inspection.vehicle?.model || inspection.vehicleModel || inspection.publicacion?.vehiculo?.modelo || null,
          mechanicId: inspection.mecanicoId || inspection.mechanicId || mechanic?.id,
          mechanicName: mechanic 
            ? `${mechanic.primerNombre || mechanic.firstName || ''} ${mechanic.primerApellido || mechanic.lastName || ''}`.trim()
            : inspection.mechanicName || null,
          mechanicPhoto: mechanic?.foto_url || mechanic?.profilePhoto || null,
          mechanic: mechanic,
          status: inspection.estado_insp || inspection.status || 'pending',
          scheduledDate: inspection.fechaProgramada || inspection.scheduledDate || inspection.fechaCreacion || inspection.createdAt,
          price: inspection.valor || inspection.price || 0,
          paymentStatus: inspection.estado_pago || inspection.paymentStatus || 'pending',
          createdAt: inspection.fechaCreacion || inspection.createdAt,
          updatedAt: inspection.updatedAt,
          mechanicCommission: inspection.mechanicCommission || (inspection.price ? inspection.price * 0.7 : 0),
        };
      });
      
      console.log('✅ Inspecciones transformadas:', inspections);
      return inspections;
    } catch (error) {
      console.error('Error getAllInspections:', error);
      throw error;
    }
  }

  async enrichInspectionWithVehicleData(inspection: AdminInspection): Promise<AdminInspection> {
    // Si ya tiene marca y modelo, retornar sin cambios
    if (inspection.vehicleBrand && inspection.vehicleModel) {
      return inspection;
    }

    // Si no hay patente, no se puede consultar
    if (!inspection.vehiclePatent) {
      return {
        ...inspection,
        vehicleBrand: 'Sin información',
        vehicleModel: 'Sin información',
      };
    }

    // Llamar a API externa
    try {
      console.log('🌐 Enriqueciendo inspección con patente:', inspection.vehiclePatent);
      const externalData = await this.getVehicleDataByPlate(inspection.vehiclePatent);
      
      if (externalData) {
        return {
          ...inspection,
          vehicleBrand: inspection.vehicleBrand || externalData.brand,
          vehicleModel: inspection.vehicleModel || externalData.model,
        };
      }
    } catch (error) {
      console.error('Error al enriquecer inspección:', error);
    }

    return {
      ...inspection,
      vehicleBrand: inspection.vehicleBrand || 'Sin información',
      vehicleModel: inspection.vehicleModel || 'Sin información',
    };
  }

  async getVehicleDataByPlate(plate: string): Promise<{ brand: string; model: string; year: number } | null> {
    try {
      console.log('🚗 Buscando datos para patente:', plate);
      const response = await fetch(`${GETAPI_URL}/${plate}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'x-api-key': GETAPI_KEY,
        },
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        console.error(`❌ Error en API externa para patente ${plate}:`, response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        return null;
      }

      const apiResponse = await response.json();
      console.log('📦 Datos recibidos de API externa:', JSON.stringify(apiResponse, null, 2));
      
      // Verificar que la respuesta sea exitosa
      if (!apiResponse.success || !apiResponse.data) {
        console.error('❌ API retornó success=false o sin data');
        return null;
      }

      const data = apiResponse.data;
      
      const result = {
        brand: data.model?.brand?.name || 'Sin información',
        model: data.model?.name || 'Sin información',
        year: data.year || null,
      };
      
      console.log('✅ Datos procesados:', result);
      return result;
    } catch (error) {
      console.error('❌ Error getVehicleDataByPlate:', error);
      return null;
    }
  }

  async assignInspectionToMechanic(inspectionId: string, mechanicId: string): Promise<AdminInspection> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/admin/inspections/${inspectionId}/assign`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ mechanicId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al asignar inspección');
      }

      return await response.json();
    } catch (error) {
      console.error('Error assignInspectionToMechanic:', error);
      throw error;
    }
  }

  async updateInspectionStatus(inspectionId: string, status: string): Promise<AdminInspection> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/admin/inspections/${inspectionId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar estado de inspección');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updateInspectionStatus:', error);
      throw error;
    }
  }

  async getInspectionRejections(inspectionId: string): Promise<any[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/inspections/${inspectionId}/rejections`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Error al obtener rechazos de la inspección');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getInspectionRejections:', error);
      throw error;
    }
  }

  async getMechanicInspections(mechanicId: string): Promise<any[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/inspections/mechanic/${mechanicId}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Error al obtener inspecciones del mecánico');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getMechanicInspections:', error);
      throw error;
    }
  }

  async getInspectionById(id: string): Promise<any> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/inspections/${id}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Error al obtener detalles de la inspección');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getInspectionById:', error);
      throw error;
    }
  }

  // Alias para métodos más cortos
  async getInspections(params: any = {}): Promise<AdminInspection[]> {
    return this.getAllInspections(params);
  }

  async getMechanics(): Promise<Mechanic[]> {
    return this.getAllMechanics();
  }

  // Publicaciones
  async getAllPublications(
    status?: string,
    limit?: number,
    offset?: number
  ): Promise<{ publications: any[], total: number }> {
    try {
      const headers = await this.getHeaders();
      let url = `${API_URL}/admin/publications`;
      
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (limit !== undefined) params.append('limit', limit.toString());
      if (offset !== undefined) params.append('offset', offset.toString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Error al obtener publicaciones');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getAllPublications:', error);
      throw error;
    }
  }

  async updatePublicationStatus(publicationId: string, status: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/admin/publications/${publicationId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar estado de la publicación');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updatePublicationStatus:', error);
      throw error;
    }
  }

  async deletePublication(publicationId: string): Promise<void> {
    try {
      // Change deletion semantics: mark publication as blocked
      return await this.updatePublicationStatus(publicationId, 'blocked');
    } catch (error) {
      console.error('Error deletePublication (block):', error);
      throw error;
    }
  }
}

export default new AdminService();
