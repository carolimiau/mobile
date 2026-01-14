import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../../components/ui/Screen';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { ImageUploader } from '../../../components/ui/ImageUploader';
import { useRawPublish } from '../../../hooks/useRawPublish';

export default function RawPublishScreen() {
  const router = useRouter();
  const {
    currentStep,
    formData,
    updateFormData,
    handlePlateChange,
    loadingPlateData,
    plateValid,
    nextStep,
    prevStep,
    handleImagesUploaded,
    publish,
    loading,
    isEditMode,
  } = useRawPublish();

  const totalSteps = 5;

  const renderStep1 = () => (
    <View>
      <Text style={styles.sectionTitle}>{isEditMode ? 'Patente del Vehículo' : 'Validar Patente'}</Text>
      <Text style={styles.subtitle}>
        {isEditMode ? 'La patente no puede modificarse al editar.' : 'Ingresa la patente de tu vehículo para comenzar.'}
      </Text>
      <Input
        label="Patente"
        value={formData.patente}
        onChangeText={handlePlateChange}
        placeholder="ABCD12"
        maxLength={6}
        autoCapitalize="characters"
        editable={!loadingPlateData && !isEditMode}
        rightIcon={
          loadingPlateData ? (
            <ActivityIndicator size="small" color="#4CAF50" />
          ) : plateValid === true ? (
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          ) : plateValid === false ? (
            <Ionicons name="alert-circle" size={24} color="#FF9800" />
          ) : null
        }
      />
      {plateValid === true && (
        <Text style={styles.successText}>✓ Datos encontrados</Text>
      )}
      {plateValid === false && (
        <Text style={styles.warningText}>⚠ No se encontraron datos. Intenta con otra patente.</Text>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.sectionTitle}>Información Básica</Text>
      <Input
        label="Marca"
        value={formData.brand}
        onChangeText={(text) => updateFormData('brand', text)}
        placeholder="Marca del vehículo"
        editable={false}
      />
      <Input
        label="Modelo"
        value={formData.model}
        onChangeText={(text) => updateFormData('model', text)}
        placeholder="Yaris"
        editable={false}
      />
      <Input
        label="Versión"
        value={formData.version}
        onChangeText={(text) => updateFormData('version', text)}
        placeholder="1.8 XEI MT"
        editable={false}
      />
      <Input
        label="Año"
        value={formData.year}
        onChangeText={(text) => updateFormData('year', text.replace(/[^0-9]/g, ''))}
        placeholder="2020"
        keyboardType="numeric"
        maxLength={4}
        editable={false}
      />
      <Input
        label="Color"
        value={formData.color}
        onChangeText={(text) => updateFormData('color', text)}
        placeholder="Rojo"
        editable={false}
      />
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.sectionTitle}>Información Específica</Text>
      <Input
        label="Kilometraje"
        value={formData.kilometers}
        onChangeText={(text) => {
          // Remover todo excepto números
          let numbers = text.replace(/[^0-9]/g, '');
          // Remover ceros a la izquierda
          numbers = numbers.replace(/^0+/, '');
          // Formatear con puntos de miles
          const formatted = numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
          updateFormData('kilometers', formatted);
        }}
        placeholder="50.000"
        keyboardType="numeric"
      />
      <Select
        label="Combustible"
        value={formData.fuelType}
        onChange={(value) => updateFormData('fuelType', value)}
        options={[
          { label: 'Gasolina', value: 'Gasolina' },
          { label: 'Diesel', value: 'Diesel' },
          { label: 'Híbrido', value: 'Híbrido' },
          { label: 'Eléctrico', value: 'Eléctrico' },
        ]}
        placeholder="Selecciona combustible"
      />
      <Select
        label="Transmisión"
        value={formData.transmission}
        onChange={(value) => updateFormData('transmission', value)}
        options={[
          { label: 'Automática', value: 'Automática' },
          { label: 'Manual', value: 'Manual' },
        ]}
        placeholder="Selecciona transmisión"
      />
      <Select
        label="Tipo de Vehículo"
        value={formData.tipoVehiculo}
        onChange={(value) => updateFormData('tipoVehiculo', value)}
        options={[
          { label: 'Automovil', value: 'Automovil' },
          { label: 'SUV', value: 'SUV' },
          { label: 'Camioneta', value: 'Camioneta' },
          { label: 'Furgón', value: 'Furgón' },
          { label: 'Moto', value: 'Moto' },
        ]}
        placeholder="Selecciona tipo"
      />
      <Select
        label="Carrocería"
        value={formData.bodyType}
        onChange={(value) => updateFormData('bodyType', value)}
        options={[
          { label: 'SUV', value: 'SUV' },
          { label: 'Sedán', value: 'Sedán' },
          { label: 'Hatchback', value: 'Hatchback' },
          { label: 'Camioneta', value: 'Camioneta' },
          { label: 'Coupé', value: 'Coupé' },
        ]}
        placeholder="Selecciona carrocería"
      />
      <Select
        label="Número de Puertas"
        value={formData.doors}
        onChange={(value) => updateFormData('doors', value)}
        options={[
          { label: '2', value: '2' },
          { label: '3', value: '3' },
          { label: '4', value: '4' },
          { label: '5', value: '5' },
        ]}
        placeholder="Selecciona puertas"
      />
      <Input
        label="VIN"
        value={formData.vin}
        onChangeText={(text) => updateFormData('vin', text)}
        placeholder="VF1LZBC16EC273765"
        editable={false}
      />
      <Input
        label="Número de Motor"
        value={formData.numeroMotor}
        onChangeText={(text) => updateFormData('numeroMotor', text)}
        placeholder="M4RJ714N291083"
        editable={false}
      />
      <Input
        label="Cilindrada (cc)"
        value={formData.motor}
        onChangeText={(text) => updateFormData('motor', text)}
        placeholder="1800"
        editable={false}
      />
      <Select
        label="Mes de Revisión Técnica"
        value={formData.mesRevisionTecnica}
        onChange={(value) => updateFormData('mesRevisionTecnica', value)}
        options={[
          { label: 'Enero', value: 'Enero' },
          { label: 'Febrero', value: 'Febrero' },
          { label: 'Marzo', value: 'Marzo' },
          { label: 'Abril', value: 'Abril' },
          { label: 'Mayo', value: 'Mayo' },
          { label: 'Junio', value: 'Junio' },
          { label: 'Julio', value: 'Julio' },
          { label: 'Agosto', value: 'Agosto' },
          { label: 'Septiembre', value: 'Septiembre' },
          { label: 'Octubre', value: 'Octubre' },
          { label: 'Noviembre', value: 'Noviembre' },
          { label: 'Diciembre', value: 'Diciembre' },
        ]}
        placeholder="Selecciona mes"
      />
      <Input
        label="Descripción"
        value={formData.description}
        onChangeText={(text) => updateFormData('description', text)}
        placeholder="Describe tu vehículo..."
        multiline
        numberOfLines={4}
      />
    </View>
  );

  const renderStep4 = () => (
    <View>
      <Text style={styles.sectionTitle}>Precio del Vehículo</Text>
      <Text style={styles.subtitle}>Define el precio de venta de tu vehículo.</Text>
      
      <View style={styles.priceSection}>
        <Text style={styles.priceLabel}>Escribe aqui el precio del vehículo</Text>
        <Input
          value={formData.price}
          onChangeText={(text) => {
            // Remover todo excepto números
            let numbers = text.replace(/[^0-9]/g, '');
            // Remover ceros a la izquierda
            numbers = numbers.replace(/^0+/, '');
            // Formatear con puntos de miles
            const formatted = numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            updateFormData('price', formatted);
          }}
          placeholder="10.000.000"
          keyboardType="numeric"
          style={styles.priceInput}
        />
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View>
      <Text style={styles.sectionTitle}>Fotos</Text>
      <Text style={styles.subtitle}>Sube al menos 1 foto de tu vehículo.</Text>
      <ImageUploader
        onImagesChange={(images) => updateFormData('images', images)}
        maxImages={10}
        folder="vehicles"
        hideUploadButton={true}
        images={formData.images}
      />
    </View>
  );

  return (
    <Screen backgroundColor="#F5F5F5" edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButtonHeader}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Publicar Vehículo</Text>
          </View>
          <Text style={styles.stepIndicator}>Paso {currentStep} de {totalSteps}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}

          <View style={styles.navigationButtons}>
            {currentStep > 1 && (
              <Button
                variant="outline"
                title="Anterior"
                onPress={prevStep}
                style={styles.navButton}
              />
            )}
            {currentStep < 5 && (
              <Button
                title="Siguiente"
                onPress={nextStep}
                style={styles.navButton}
                disabled={currentStep === 1 && !plateValid}
              />
            )}
            {currentStep === 5 && (
              <Button
                title={isEditMode ? "Guardar Cambios" : "Publicar"}
                onPress={publish}
                loading={loading}
                style={styles.navButton}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonHeader: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepIndicator: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  successText: {
    color: '#4CAF50',
    marginTop: 8,
    marginLeft: 4,
  },
  warningText: {
    color: '#FF9800',
    marginTop: 8,
    marginLeft: 4,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  navButton: {
    flex: 1,
  },
  priceSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  priceInput: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#4CAF50',
  },
});
