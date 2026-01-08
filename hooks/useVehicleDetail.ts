import { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import apiService from '../services/apiService';
import authService from '../services/authService';
import { Vehicle, User } from '../types';

export function useVehicleDetail() {
  const { id } = useLocalSearchParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    loadCurrentUser();
    if (id) {
      loadVehicle(id as string);
    }
  }, [id]);

  const loadCurrentUser = async () => {
    const user = await authService.getUser();
    setCurrentUser(user);
  };

  const loadVehicle = async (vehicleId: string) => {
    try {
      setLoading(true);
      const data = await apiService.getVehicleById(vehicleId);
      setVehicle(data);

      if (data.publicationId) {
        try {
          const likeStatus = await apiService.get(`/publications/${data.publicationId}/is-liked`);
          setIsLiked(likeStatus.isLiked);
        } catch (e) {
          console.log('Error checking like status', e);
        }
      }
    } catch (error) {
      console.error('Error loading vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async () => {
    if (!vehicle?.publicationId) return;
    try {
      if (isLiked) {
        await apiService.delete(`/publications/${vehicle.publicationId}/like`);
        setIsLiked(false);
      } else {
        await apiService.post(`/publications/${vehicle.publicationId}/like`);
        setIsLiked(true);
      }
    } catch (e) {
      console.error('Error toggling like', e);
    }
  };

  const deactivateVehicle = async () => {
    if (!vehicle?.publicationId) return;
    
    Alert.alert(
      'Eliminar Publicación',
      '¿Estás seguro que deseas eliminar esta publicación? Esta acción no se puede deshacer',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deactivatePublication(vehicle.publicationId!);
              Alert.alert('Éxito', 'Publicación eliminada correctamente', [
                { text: 'OK', onPress: () => loadVehicle(vehicle.id) }
              ]);
            } catch (error: any) {
              const errorMessage = error.message || 'No se pudo eliminar la publicación';
              Alert.alert('No se pudo eliminar', errorMessage);
            }
          },
        },
      ]
    );
  };

  const isOwner = currentUser?.id === vehicle?.userId;

  const refresh = useCallback(() => {
    if (id) {
      loadVehicle(id as string);
    }
  }, [id]);

  return {
    vehicle,
    loading,
    isLiked,
    isOwner,
    toggleLike,
    deactivateVehicle,
    refresh,
  };
}
