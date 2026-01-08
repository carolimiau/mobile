import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/ui/Screen';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';
import { useRegister } from '../hooks/useRegister';

export default function RegisterScreen() {
  const {
    currentStep,
    primerNombre, setPrimerNombre,
    segundoNombre, setSegundoNombre,
    primerApellido, setPrimerApellido,
    segundoApellido, setSegundoApellido,
    rut, handleRutChange, rutValid,
    birthDate, setBirthDate,
    region, setRegion,
    comuna, setComuna,
    phone, setPhone,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    loading,
    regiones,
    comunasFiltradas,
    nextStep,
    prevStep,
    register,
    emailError,
    passwordErrors,
    showPasswordErrors,
  } = useRegister();

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);

  const handleNameChange = (text: string, setter: (value: string) => void) => {
    // Solo permitir letras y espacios (incluyendo tildes y ñ)
    if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(text)) {
      setter(text);
    }
  };

  const formatRut = (rut: string) => {
    // Eliminar todo lo que no sea números o k
    let value = rut.replace(/[^0-9kK]/g, '');
    
    // Limitar largo máximo (cuerpo 8 + dv 1 = 9)
    if (value.length > 9) {
        value = value.slice(0, 9);
    }

    // Si está vacío, retornar vacío
    if (value.length === 0) return '';

    // Separar cuerpo y dv
    const dv = value.slice(-1);
    let body = value.slice(0, -1);

    if (body.length > 0) {
        // Formatear cuerpo con puntos
        body = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${body}-${dv}`;
    }
    
    return value;
  };

  const onRutChange = (text: string) => {
      const formatted = formatRut(text);
      handleRutChange(formatted);
  };

  const handlePhoneChange = (text: string) => {
    let digits = text.replace(/\D/g, '');
    
    // Si borran el prefijo 569, lo restauramos
    if (digits.length < 3) {
        digits = '569';
    }
    
    // Si pegan un número sin prefijo, agregamos 569
    if (!digits.startsWith('569')) {
        digits = '569' + digits;
    }
    
    // Limitar a 11 dígitos (56 9 XXXX XXXX)
    if (digits.length > 11) {
        digits = digits.slice(0, 11);
    }
    
    // Formatear: +56 9 XXXX XXXX
    let formatted = '+56 9 ';
    const rest = digits.slice(3);
    
    if (rest.length > 0) {
        formatted += rest.slice(0, 4);
        if (rest.length > 4) {
            formatted += ' ' + rest.slice(4, 8);
        }
    }
    
    setPhone(formatted);
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              currentStep >= step ? styles.stepActive : styles.stepInactive,
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                currentStep >= step ? styles.stepNumberActive : styles.stepNumberInactive,
              ]}
            >
              {step}
            </Text>
          </View>
          {step < 3 && (
            <View
              style={[
                styles.stepLine,
                currentStep > step ? styles.stepLineActive : styles.stepLineInactive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View>
      <Text style={styles.sectionTitle}>Datos Personales</Text>
      <Input
        label="Primer Nombre"
        placeholder="Ingresa tu primer nombre"
        value={primerNombre}
        onChangeText={(text) => handleNameChange(text, setPrimerNombre)}
      />
      <Input
        label="Segundo Nombre (opcional)"
        placeholder="Ingresa tu segundo nombre"
        value={segundoNombre}
        onChangeText={(text) => handleNameChange(text, setSegundoNombre)}
      />
      <Input
        label="Primer Apellido"
        placeholder="Ingresa tu primer apellido"
        value={primerApellido}
        onChangeText={(text) => handleNameChange(text, setPrimerApellido)}
      />
      <Input
        label="Segundo Apellido (opcional)"
        placeholder="Ingresa tu segundo apellido"
        value={segundoApellido}
        onChangeText={(text) => handleNameChange(text, setSegundoApellido)}
      />
      <Input
        label="RUT"
        placeholder="12.345.678-9"
        value={rut}
        onChangeText={onRutChange}
        error={rutValid === false ? 'RUT inválido' : undefined}
        maxLength={12}
      />
      <DatePicker
        label="Fecha de Nacimiento"
        value={birthDate}
        onChange={setBirthDate}
        maximumDate={maxDate}
      />
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.sectionTitle}>Ubicación y Contacto</Text>
      <Select
        label="Región"
        value={region}
        options={regiones.map(r => ({ label: r.name, value: r.name }))}
        onChange={setRegion}
        placeholder="Selecciona tu región"
      />
      <Select
        label="Comuna"
        value={comuna}
        options={comunasFiltradas.map(c => ({ label: c.name, value: c.name }))}
        onChange={setComuna}
        placeholder="Selecciona tu comuna"
        disabled={!region}
      />
      <Input
        label="Teléfono"
        placeholder="+56 9 1234 5678"
        value={phone}
        onChangeText={handlePhoneChange}
        keyboardType="phone-pad"
        maxLength={15}
      />
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.sectionTitle}>Cuenta</Text>
      <Input
        label="Correo Electrónico"
        placeholder="ejemplo@correo.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        error={emailError}
      />
      <Input
        label="Contraseña"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
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

      <Input
        label="Confirmar Contraseña"
        placeholder="••••••••"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
    </View>
  );

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
    <Screen backgroundColor="#FFFFFF">
      <View style={styles.header}>
        <TouchableOpacity onPress={prevStep} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registro</Text>
        <View style={{ width: 24 }} />
      </View>

      {renderStepIndicator()}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          <View style={styles.footer}>
            <Button
              title={currentStep === 3 ? "Registrarse" : "Continuar"}
              onPress={currentStep === 3 ? register : nextStep}
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  stepActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  stepInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepNumberInactive: {
    color: '#999',
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#4CAF50',
  },
  stepLineInactive: {
    backgroundColor: '#E0E0E0',
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  footer: {
    marginTop: 32,
  },
  passwordRequirements: {
    marginTop: 8,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
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
