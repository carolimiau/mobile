import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
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
    uploadingAvatar
  } = useProfile();

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
            onChangeText={(text) => updateFormData('primerNombre', text)}
            editable={isEditing}
            placeholder="Tu nombre"
          />
          <Input
            label="Apellido"
            value={formData.primerApellido}
            onChangeText={(text) => updateFormData('primerApellido', text)}
            editable={isEditing}
            placeholder="Tu apellido"
          />
          <Input
            label="Email"
            value={formData.email}
            onChangeText={(text) => updateFormData('email', text)}
            editable={false}
            placeholder="tu@email.com"
          />
          <Input
            label="Teléfono"
            value={formData.telefono}
            onChangeText={(text) => updateFormData('telefono', text)}
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
            <Button
              title="Guardar Cambios"
              onPress={handleSave}
              loading={saving}
              style={styles.saveButton}
            />
          )}
        </View>
      </ScrollView>
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
});
