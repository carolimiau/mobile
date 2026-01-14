import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/ui/Screen';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useProfile } from '../hooks/useProfile';
import { useRouter } from 'expo-router';
import { getImageUrl } from '../utils/imageUtils';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user,
    loading,
    saving,
    isEditing,
    setIsEditing,
    formData,
    updateFormData,
    handleSave,
    handleAvatarChange,
    uploadingAvatar,
    passwordErrors,
    showPasswordErrors,
    emailError,
  } = useProfile();

  const handleNameChange = (text: string, field: string) => {
    // Solo permitir letras y espacios (incluyendo tildes y ñ)
    if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(text)) {
      updateFormData(field, text);
    }
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
    
    updateFormData('telefono', formatted);
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

  if (loading) {
    return (
      <Screen backgroundColor="#F5F5F5">
        <View style={styles.centerContainer}>
          <Text>Cargando perfil...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#F5F5F5">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Text style={styles.editButton}>{isEditing ? 'Cancelar' : 'Editar'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarContainer}>
          {user?.foto_url ? (
            <Image
              source={{ uri: getImageUrl(user.foto_url) }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.primerNombre?.charAt(0)}{user?.primerApellido?.charAt(0)}
              </Text>
            </View>
          )}
          {uploadingAvatar && <ActivityIndicator size="small" color="#4CAF50" style={styles.avatarLoader} />}
          {isEditing && (
            <View style={styles.avatarActions}>
              <TouchableOpacity
                onPress={() => handleAvatarChange(false)}
                style={styles.avatarButton}
                disabled={uploadingAvatar}
              >
                <Ionicons name="image" size={16} color="#fff" />
                <Text style={styles.avatarButtonText}>Galería</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleAvatarChange(true)}
                style={styles.avatarButton}
                disabled={uploadingAvatar}
              >
                <Ionicons name="camera" size={16} color="#fff" />
                <Text style={styles.avatarButtonText}>Cámara</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.userName}>{user?.primerNombre} {user?.primerApellido}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Nombre"
            value={formData.primerNombre}
            onChangeText={(text) => handleNameChange(text, 'primerNombre')}
            editable={isEditing}
            placeholder="Tu nombre"
          />
          <Input
            label="Apellido"
            value={formData.primerApellido}
            onChangeText={(text) => handleNameChange(text, 'primerApellido')}
            editable={isEditing}
            placeholder="Tu apellido"
          />
          <Input
            label="Email"
            value={formData.email}
            onChangeText={(text) => updateFormData('email', text)}
            editable={isEditing}
            placeholder="tu@email.com"
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Teléfono"
            value={formData.telefono}
            onChangeText={handlePhoneChange}
            editable={isEditing}
            placeholder="+56 9 1234 5678"
            keyboardType="phone-pad"
          />
          <Input
            label="RUT"
            value={formData.rut}
            onChangeText={(text) => updateFormData('rut', text)}
            editable={false}
            placeholder="12.345.678-9"
          />

          {isEditing && (
            <View style={styles.passwordSection}>
              <Text style={styles.passwordSectionTitle}>Cambiar Contraseña (Opcional)</Text>
              <Input
                label="Nueva Contraseña"
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                placeholder="••••••••"
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
                label="Confirmar Nueva Contraseña"
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                placeholder="••••••••"
                secureTextEntry
              />
            </View>
          )}

          {isEditing && (
            <Button
              title="Guardar Cambios"
              onPress={handleSave}
              loading={saving}
              style={styles.saveButton}
            />
          )}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  avatarActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    marginHorizontal: 4,
  },
  avatarButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  avatarLoader: {
    position: 'absolute',
    top: 36,
    right: -8,
  },
  form: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  saveButton: {
    marginTop: 16,
  },
  passwordSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  passwordSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
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
