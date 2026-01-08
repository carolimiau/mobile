import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';
import apiService from '../services/apiService';
import { Vehicle } from '../types';

export function useEditPublication() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const vehicleId = params.vehicleId as string;
  const publicationId = params.publicationId as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    kilometers: '',
    price: '',
    description: '',
  });

  useEffect(() => {
    if (vehicleId) {
      loadVehicle();
    }
  }, [vehicleId]);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      const data = await apiService.getVehicleById(vehicleId);
      setVehicle(data);
      
      // Initialize form with current values
      setFormData({
        kilometers: data.kilometraje?.toString() || '',
        price: data.valor?.toString() || '',
        description: data.descripcion || '',
      });
    } catch (error) {
      console.error('Error loading vehicle:', error);
      Alert.alert('Error', 'No se pudo cargar el vehículo');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validate
    if (!formData.kilometers || !formData.price) {
      Alert.alert('Error', 'El kilometraje y el precio son obligatorios');
      return;
    }

    const kilometers = parseInt(formData.kilometers);
    const price = parseInt(formData.price);

    if (isNaN(kilometers) || kilometers < 0) {
      Alert.alert('Error', 'El kilometraje debe ser un número válido');
      return;
    }

    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'El precio debe ser un número válido mayor a 0');
      return;
    }

    try {
      setSaving(true);

      // Update vehicle
      await apiService.patch(`/vehicles/${vehicleId}`, {
        kilometraje: kilometers,
        descripcion: formData.description,
      });

      // Update publication (precio)
      await apiService.patch(`/publications/${publicationId}`, {
        valor: price,
      });

      Alert.alert(
        'Éxito',
        'Publicación actualizada correctamente',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error updating publication:', error);
      Alert.alert(
        'Error',
        error.message || 'No se pudo actualizar la publicación'
      );
    } finally {
      setSaving(false);
    }
  };

  return {
    vehicle,
    loading,
    formData,
    updateFormData,
    handleSave,
    saving,
  };
}
