import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '../components/ui/Screen';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';
import apiService from '../services/apiService';
import authService from '../services/authService';

export default function ScheduleInspectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { vehicleId, publicationId } = params;

  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [autoBoxLocations, setAutoBoxLocations] = useState<any[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{ id: number; time: string }[]>([]);
  const [inspectionPrice, setInspectionPrice] = useState(40000);

  const [formData, setFormData] = useState({
    inspectionDate: '',
    inspectionTime: '',
    inspectionLocation: '',
    horarioId: null as number | null,
  });

  useEffect(() => {
    loadSettings();
    loadSedes();
  }, []);

  useEffect(() => {
    if (formData.inspectionDate && formData.inspectionLocation) {
      loadTimeSlots();
    }
  }, [formData.inspectionDate, formData.inspectionLocation]);

  const loadSettings = async () => {
    try {
      const prices = await apiService.getPrices();
      const inspPrice = prices.find((p: any) => p.nombre.toLowerCase() === 'inspeccion');
      if (inspPrice) {
        setInspectionPrice(inspPrice.precio);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadSedes = async () => {
    try {
      const sedes = await apiService.get('/sedes');
      if (Array.isArray(sedes)) {
        const formattedSedes = sedes.map((sede: any) => ({
          id: String(sede.id),
          name: sede.nombre,
          address: sede.direccion
        }));
        setAutoBoxLocations(formattedSedes);
      }
    } catch (error) {
      console.error('Error loading sedes:', error);
    }
  };

  const loadTimeSlots = async () => {
    setLoadingSlots(true);
    try {
      let formattedDate = formData.inspectionDate;
      if (formData.inspectionDate.includes('/')) {
        const [day, month, year] = formData.inspectionDate.split('/');
        formattedDate = `${year}-${month}-${day}`;
      } else if (formData.inspectionDate.includes('T')) {
        formattedDate = formData.inspectionDate.split('T')[0];
      }

      const locationName = autoBoxLocations.find(l => l.id === formData.inspectionLocation)?.name || formData.inspectionLocation;
      
      const slots = await apiService.getAvailableSlots(formattedDate, locationName);
      setAvailableTimeSlots(slots || []);
    } catch (error) {
      console.error('Error loading slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleContinue = async () => {
    if (!formData.inspectionDate || !formData.inspectionTime || !formData.inspectionLocation) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const user = await authService.getUser();
    if (!user) {
      Alert.alert('Atención', 'Debes iniciar sesión para agendar una inspección', [
        { text: 'Ir al Login', onPress: () => router.push('/auth') },
        { text: 'Cancelar', style: 'cancel' }
      ]);
      return;
    }

    const metadata = JSON.stringify({
      vehicleId,
      publicationId,
      solicitanteId: user.id,
      inspectionDate: formData.inspectionDate,
      inspectionTime: formData.inspectionTime,
      inspectionLocation: formData.inspectionLocation,
      horarioId: formData.horarioId
    });

    router.push({
      pathname: '/payment-gateway',
      params: {
        amount: inspectionPrice.toString(),
        description: 'Inspección AutoBox',
        serviceType: 'inspection_only',
        metadata
      }
    });
  };

  return (
    <Screen backgroundColor="#FFF">
      <View style={styles.container}>
        <Text style={styles.title}>Agendar Inspección</Text>
        <Text style={styles.subtitle}>Elige dónde y cuándo quieres inspeccionar este auto.</Text>
        
        <Select
          label="Ubicación AutoBox"
          value={formData.inspectionLocation}
          onChange={(value) => updateFormData('inspectionLocation', value)}
          options={autoBoxLocations.map(l => ({ label: l.name, value: l.id }))}
          placeholder="Selecciona ubicación"
        />

        <DatePicker
          label="Fecha"
          value={formData.inspectionDate}
          onChange={(date) => updateFormData('inspectionDate', date)}
          minimumDate={new Date()}
        />

        <Select
          label="Hora"
          value={formData.inspectionTime}
          onChange={(value) => {
              updateFormData('inspectionTime', value);
              const slot = availableTimeSlots.find(s => s.time === value);
              if (slot) updateFormData('horarioId', slot.id);
          }}
          options={availableTimeSlots.map(s => ({ label: s.time, value: s.time }))}
          placeholder="Selecciona hora"
          disabled={!formData.inspectionDate || !formData.inspectionLocation || loadingSlots}
        />
        
        {loadingSlots && <ActivityIndicator size="small" color="#4CAF50" />}

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Total a pagar:</Text>
            <Text style={styles.priceValue}>${inspectionPrice.toLocaleString('es-CL')}</Text>
          </View>
          <Button title="Continuar al Pago" onPress={handleContinue} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  footer: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});
