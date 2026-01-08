import apiService from './apiService';

export interface VehicleDataByPlate {
  success: boolean;
  data?: {
    plate: string;
    dvPlate?: string;
    brand?: string;
    model?: string;
    year?: number;
    version?: string;
    color?: string;
    fuelType?: string;
    transmission?: string;
    doors?: number;
    vin?: string;
    engineNumber?: string;
    engine?: string;
    kilometers?: number;
    vehicleType?: string;
    monthRT?: string;
  };
  message?: string;
}

class VehicleService {
  /**
   * Busca datos del vehículo por patente usando la API del backend
   * @param plate - Patente del vehículo (6 caracteres)
   * @returns Datos del vehículo si se encuentra
   */
  async searchByPlate(plate: string): Promise<VehicleDataByPlate> {
    try {
      if (!plate || plate.length !== 6) {
        return {
          success: false,
          message: 'Patente debe tener 6 caracteres'
        };
      }

      const normalizedPlate = plate.toUpperCase().trim();
      console.log('🔍 [VehicleService] Buscando patente:', normalizedPlate);

      const result = await apiService.getVehicleDataByPlate(normalizedPlate);
      
      console.log('📦 [VehicleService] Datos recibidos de apiService:', JSON.stringify(result, null, 2));
      
      if (result && result.success && result.data) {
        console.log('✅ [VehicleService] Datos encontrados:', result.data);
        
        const vehicleData = result.data;
        
        // Mapear tipo de combustible
        const mapFuelType = (fuel?: string): string => {
          if (!fuel) return 'Gasolina';
          const fuelMap: { [key: string]: string } = {
            'BENCINA': 'Gasolina',
            'GASOLINA': 'Gasolina',
            'DIESEL': 'Diesel',
            'ELECTRICO': 'Eléctrico',
            'ELÉCTRICO': 'Eléctrico',
            'HIBRIDO': 'Híbrido',
            'HÍBRIDO': 'Híbrido',
          };
          return fuelMap[fuel.toUpperCase()] || fuel;
        };
        
        return {
          success: true,
          data: {
            plate: vehicleData.plate || normalizedPlate,
            dvPlate: vehicleData.dvPlate || '',
            brand: vehicleData.brand || '',
            model: vehicleData.model || '',
            year: vehicleData.year || undefined,
            version: vehicleData.version || '',
            color: vehicleData.color || '',
            fuelType: mapFuelType(vehicleData.fuelType),
            transmission: vehicleData.transmission || '',
            doors: vehicleData.doors || undefined,
            vin: vehicleData.vin || '',
            engineNumber: vehicleData.engineNumber || '',
            engine: vehicleData.engine || '',
            kilometers: vehicleData.kilometers || vehicleData.mileage || undefined,
            vehicleType: vehicleData.vehicleType || '',
            monthRT: vehicleData.monthRT || '',
          }
        };
      } else {
        console.log('ℹ️ [VehicleService] No se encontraron datos para la patente');
        return {
          success: false,
          message: 'No se encontraron datos para esta patente'
        };
      }
    } catch (error: any) {
      console.error('❌ [VehicleService] Error al buscar patente:', error);
      
      // Si es un error 404, la patente no existe
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return {
          success: false,
          message: 'No se encontraron datos para esta patente'
        };
      }
      
      return {
        success: false,
        message: 'Error al buscar datos del vehículo'
      };
    }
  }

  /**
   * Valida el formato de una patente chilena
   * @param plate - Patente a validar
   * @returns true si el formato es válido
   */
  validatePlateFormat(plate: string): boolean {
    if (!plate || plate.length !== 6) {
      return false;
    }

    const normalizedPlate = plate.toUpperCase();
    
    // Formato antiguo: XXXX12 (4 letras + 2 números)
    const oldFormat = /^[A-Z]{4}\d{2}$/;
    
    // Formato nuevo: XXXX12 o XX1234 (variables)
    const newFormat = /^[A-Z0-9]{6}$/;
    
    return oldFormat.test(normalizedPlate) || newFormat.test(normalizedPlate);
  }

  /**
   * Formatea una patente eliminando caracteres inválidos
   * @param plate - Patente a formatear
   * @returns Patente formateada (máximo 6 caracteres)
   */
  formatPlate(plate: string): string {
    return plate
      .replace(/[^A-Z0-9]/gi, '')
      .toUpperCase()
      .slice(0, 6);
  }
}

export default new VehicleService();
