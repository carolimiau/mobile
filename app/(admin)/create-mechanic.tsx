import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import adminService from '../../services/adminService';
import { Screen } from '../../components/ui/Screen';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { ProfileImageUploader } from '../../components/admin/ProfileImageUploader';
import { NATIONALITIES } from '../../constants/admin';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const COMMUNES_SANTIAGO = [
  'Santiago Centro', 'Cerrillos', 'Cerro Navia', 'Conchalí', 'El Bosque', 'Estación Central',
  'Huechuraba', 'Independencia', 'La Cisterna', 'La Florida', 'La Granja', 'La Pintana',
  'La Reina', 'Las Condes', 'Lo Espejo', 'Lo Prado', 'Macul', 'Maipú', 'Ñuñoa',
  'Pedro Aguirre Cerda', 'Peñalolén', 'Providencia', 'Pudahuel', 'Quilicura', 'Quinta Normal',
  'Recoleta', 'Renca', 'San Joaquín', 'San Miguel', 'San Ramón', 'Vitacura', 'Puente Alto',
  'Pirque', 'San José de Maipo', 'Colina', 'Lampa', 'Til Til', 'San Bernardo', 'Buin',
  'Calera de Tango', 'Paine', 'Melipilla', 'Alhue', 'Curacaví', 'María Pinto', 'San Pedro',
  'Talagante', 'El Monte', 'Isla de Maipo', 'Padre Hurtado', 'Peñaflor',
];

export default function CreateMechanicScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    rut: '',
    email: '',
    phone: '',
    password: '',
    nationality: '',
    commune: '',
    address: '',
    profilePhoto: '',
  });

  const [emailError, setEmailError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const [showPasswordErrors, setShowPasswordErrors] = useState(false);

  useEffect(() => {
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setEmailError('Correo electrónico inválido');
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }
  }, [formData.email]);

  useEffect(() => {
    if (formData.password) {
      setPasswordErrors({
        length: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        lowercase: /[a-z]/.test(formData.password),
        number: /\d/.test(formData.password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
      });
      setShowPasswordErrors(true);
    } else {
      setShowPasswordErrors(false);
    }
  }, [formData.password]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNameChange = (field: string, text: string) => {
    if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(text)) {
      setFormData(prev => ({ ...prev, [field]: text }));
    }
  };

  const formatRut = (rut: string) => {
    let value = rut.replace(/[^0-9kK]/g, '');
    if (value.length > 9) value = value.slice(0, 9);
    if (value.length === 0) return '';
    const dv = value.slice(-1);
    let body = value.slice(0, -1);
    if (body.length > 0) {
        body = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${body}-${dv}`;
    }
    return value;
  };

  const handleRutChange = (text: string) => {
      const formatted = formatRut(text);
      setFormData(prev => ({ ...prev, rut: formatted }));
  };

  const handlePhoneChange = (text: string) => {
    let digits = text.replace(/\D/g, '');
    if (digits.length < 3) digits = '569';
    if (!digits.startsWith('569')) digits = '569' + digits;
    if (digits.length > 11) digits = digits.slice(0, 11);
    
    let formatted = '+56 9 ';
    const rest = digits.slice(3);
    if (rest.length > 0) {
        formatted += rest.slice(0, 4);
        if (rest.length > 4) formatted += ' ' + rest.slice(4, 8);
    }
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const handleImageSelected = (uri: string) => {
    setFormData(prev => ({ ...prev, profilePhoto: uri }));
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.rut) {
      Alert.alert('Error', 'Por favor complete los campos obligatorios');
      return;
    }

    if (emailError) {
      Alert.alert('Error', 'Por favor corrige el correo electrónico');
      return;
    }

    const isPasswordValid = Object.values(passwordErrors).every(Boolean);
    if (!isPasswordValid) {
      Alert.alert('Error', 'La contraseña no cumple con los requisitos de seguridad');
      return;
    }

    try {
      setLoading(true);
      await adminService.createMechanic(formData);
      Alert.alert(
        'Éxito',
        'Mecánico creado correctamente',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Error creating mechanic:', error);
      Alert.alert('Error', error.message || 'No se pudo crear el mecánico');
    } finally {
      setLoading(false);
    }
  };

  const RequirementItem = ({ valid, text }: { valid: boolean; text: string }) => (
    <View style={styles.requirementItem}>
      <Ionicons 
        name={valid ? "checkmark-circle" : "close-circle"} 
        size={16} 
        color={valid ? "#4CAF50" : "#F44336"} 
      />
      <Text style={[styles.requirementText, { color: valid ? "#4CAF50" : "#F44336" }]}>
        {text}
      </Text>
    </View>
  );

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <KeyboardAwareScrollView
          style={{ flex: 1, backgroundColor: '#F8F9FA' }}
          resetScrollToCoords={{ x: 0, y: 0 }}
          contentContainerStyle={{ flexGrow: 1 }}
          scrollEnabled={true}
          enableOnAndroid={true} // Vital para que funcione en Android
          extraScrollHeight={20} // Un pequeño margen extra arriba del teclado
          keyboardShouldPersistTaps="handled" // Para que al tocar fuera se cierre el teclado o funcionen los botones
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nuevo Mecánico</Text>
          </View>

          <View style={styles.imageContainer}>
            <ProfileImageUploader
              imageUri={formData.profilePhoto}
              onImageSelected={handleImageSelected}
              placeholder="Foto de perfil"
            />
          </View>

          <View style={styles.form}>
            <Input
              label="RUT *"
              value={formData.rut}
              onChangeText={handleRutChange}
              placeholder="12.345.678-9"
              maxLength={12}
            />
            
            <View style={styles.row}>
              <Input
                label="Nombre *"
                value={formData.firstName}
                onChangeText={(text) => handleNameChange('firstName', text)}
                containerStyle={styles.halfInput}
                placeholder="Juan"
              />
              <Input
                label="Apellido *"
                value={formData.lastName}
                onChangeText={(text) => handleNameChange('lastName', text)}
                containerStyle={styles.halfInput}
                placeholder="Pérez"
              />
            </View>

            <Input
              label="Email *"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={emailError}
              placeholder="juan.perez@autobox.cl"
            />

            <Input
              label="Teléfono"
              value={formData.phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              placeholder="+56 9 1234 5678"
              maxLength={15}
            />

            <Input
              label="Contraseña *"
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
              secureTextEntry
              placeholder="••••••••"
            />

            {showPasswordErrors && (
              <View style={styles.passwordRequirements}>
                <Text style={styles.requirementsTitle}>La contraseña debe tener:</Text>
                <RequirementItem valid={passwordErrors.length} text="Mínimo 8 caracteres" />
                <RequirementItem valid={passwordErrors.uppercase} text="Una mayúscula" />
                <RequirementItem valid={passwordErrors.lowercase} text="Una minúscula" />
                <RequirementItem valid={passwordErrors.number} text="Un número" />
                <RequirementItem valid={passwordErrors.special} text="Un caracter especial (!@#$%...)" />
              </View>
            )}

            <Select
              label="Nacionalidad"
              value={formData.nationality}
              options={NATIONALITIES.map(n => ({ label: n, value: n }))}
              onChange={(value) => handleChange('nationality', value)}
              placeholder="Seleccione nacionalidad"
            />

            <Select
              label="Comuna"
              value={formData.commune}
              options={COMMUNES_SANTIAGO.map(c => ({ label: c, value: c }))}
              onChange={(value) => handleChange('commune', value)}
              placeholder="Seleccione comuna"
            />

            <Input
              label="Dirección"
              value={formData.address}
              onChangeText={(text) => handleChange('address', text)}
              placeholder="Av. Siempre Viva 123"
            />

            <Button
              title="Crear Mecánico"
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitButton}
            />
          </View>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfInput: {
    flex: 1,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 40,
  },
  passwordRequirements: {
    marginTop: 8,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    marginLeft: 6,
  },
});
