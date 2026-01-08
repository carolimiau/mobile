import React from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/ui/Screen';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useEditPublication } from '../hooks/useEditPublication';

export default function EditPublicationScreen() {
  const router = useRouter();
  const {
    vehicle,
    loading,
    formData,
    updateFormData,
    handleSave,
    saving,
  } = useEditPublication();

  if (loading) {
    return (
      <Screen backgroundColor="#FFF">
        <View style={styles.centerContainer}>
          <Text>Cargando...</Text>
        </View>
      </Screen>
    );
  }

  if (!vehicle) {
    return (
      <Screen backgroundColor="#FFF">
        <View style={styles.centerContainer}>
          <Text>No se pudo cargar el vehículo</Text>
          <Button title="Volver" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#FFF">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <Text style={styles.title}>Editar Publicación</Text>
          <Text style={styles.subtitle}>
            Solo puedes editar el kilometraje, precio y descripción
          </Text>

          {/* Información del Vehículo (Solo lectura) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información del Vehículo</Text>
            <Input
              label="Patente"
              value={vehicle.patente}
              editable={false}
            />
            <Input
              label="Marca y Modelo"
              value={`${vehicle.marca} ${vehicle.modelo}`}
              editable={false}
            />
            <Input
              label="Año"
              value={vehicle.anio?.toString() || ''}
              editable={false}
            />
          </View>

          {/* Campos Editables */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Editable</Text>
            
            <Input
              label="Kilometraje"
              value={formData.kilometers}
              onChangeText={(text) => updateFormData('kilometers', text)}
              placeholder="Ej: 50000"
              keyboardType="numeric"
            />

            <Input
              label="Precio (CLP)"
              value={formData.price}
              onChangeText={(text) => updateFormData('price', text)}
              placeholder="Ej: 5000000"
              keyboardType="numeric"
            />

            <Input
              label="Descripción"
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
              placeholder="Describe las características y estado del vehículo..."
              multiline
              numberOfLines={6}
              style={{ height: 120, textAlignVertical: 'top' }}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => router.back()}
              disabled={saving}
              style={{ marginBottom: 12 }}
            />
            <Button
              title={saving ? "Guardando..." : "Guardar Cambios"}
              onPress={handleSave}
              disabled={saving}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    marginBottom: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 40,
  },
});
