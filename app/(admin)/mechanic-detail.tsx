import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { ProfileImageUploader } from '../../components/admin/ProfileImageUploader';
import adminService, { Mechanic } from '../../services/adminService';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function MechanicDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Edit form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    loadMechanic();
  }, [id]);

  const loadMechanic = async () => {
    try {
      if (!id) return;
      setLoading(true);
      const data = await adminService.getMechanicById(id as string);
      setMechanic(data);
      
      // Init form
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setPhone(data.phone || '');
      setProfilePhoto(data.profilePhoto || '');
      setEmail(data.email || '');

    } catch (error) {
      console.error('Error loading mechanic:', error);
      Alert.alert('Error', 'No se pudo cargar la información del mecánico');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleFirstNameChange = (text: string) => {
    // Solo permitir letras y espacios (incluyendo tildes y ñ)
    if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(text)) {
      setFirstName(text);
    }
  };

  const handleLastNameChange = (text: string) => {
    // Solo permitir letras y espacios (incluyendo tildes y ñ)
    if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(text)) {
      setLastName(text);
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
    
    setPhone(formatted);
  };

  const handleImageSelected = (uri: string) => {
    setProfilePhoto(uri);
  };

  const handleSave = async () => {
    if (!mechanic) return;
    try {
      setSaving(true);
      
      // Validar duplicados solo si email o teléfono fueron cambiados
      const emailChanged = email !== mechanic.email;
      const phoneChanged = phone !== mechanic.phone;
      
      if (emailChanged || phoneChanged) {
        try {
          const cleanPhone = phone.replace(/\D/g, '');
          const existenceCheck = await adminService.checkMechanicExistence(
            mechanic.id.replace(/[^0-9kK]/g, '').toUpperCase(), 
            email, 
            cleanPhone
          );
          
          if (existenceCheck.exists) {
            Alert.alert(
              'Datos Duplicados',
              existenceCheck.message || `${existenceCheck.field} ya está registrado en el sistema.`,
              [{ text: 'OK' }]
            );
            setSaving(false);
            return;
          }
        } catch (validationError: any) {
          // Si el endpoint de validación no existe, intentar actualizar de todas formas
          console.warn('Advertencia: No se pudo validar duplicados en el servidor', validationError);
        }
      }
      
      await adminService.updateMechanic(mechanic.id, {
        firstName,
        lastName,
        phone,
        email,
        profilePhoto,
      });
      Alert.alert('Éxito', 'Información actualizada correctamente');
      loadMechanic(); // Reload to be sure
    } catch (error) {
      console.error('Error updating mechanic:', error);
      Alert.alert('Error', 'No se pudo actualizar el mecánico');
    } finally {
      setSaving(false);
    }
  };

  const handleViewInspections = () => {
    if (!mechanic) return;
    router.push({
      pathname: '/(admin)/mechanic-inspections',
      params: { mechanicId: mechanic.id, mechanicName: `${mechanic.firstName} ${mechanic.lastName}` }
    });
  };

  const handleViewPayments = () => {
    if (!mechanic) return;
    router.push({
      pathname: '/(admin)/mechanic-payments',
      params: { mechanicId: mechanic.id, mechanicName: `${mechanic.firstName} ${mechanic.lastName}` }
    });
  };

  const handleDeleteMechanic = () => {
    if (!mechanic) return;
    
    Alert.alert(
      'Eliminar Mecánico',
      `¿Seguro que deseas eliminar a ${mechanic.firstName} ${mechanic.lastName}? Esta acción no se puede deshacer.`,
      [
        {
          text: 'Cancelar',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          onPress: async () => {
            try {
              setSaving(true);
              await adminService.deleteMechanic(mechanic.id);
              Alert.alert(
                'Éxito',
                'Mecánico eliminado correctamente',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error: any) {
              console.error('Error deleting mechanic:', error);
              Alert.alert('Error', error.message || 'No se pudo eliminar el mecánico');
            } finally {
              setSaving(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };;

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      </Screen>
    );
  }

  if (!mechanic) return null;

  return (
    <Screen style={styles.container} backgroundColor="#fff">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil del Mecánico</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: '#F8F9FA' }}
      resetScrollToCoords={{ x: 0, y: 0 }}
      contentContainerStyle={{ flexGrow: 1 }}
      scrollEnabled={true}
      enableOnAndroid={true} // Vital para que funcione en Android
      extraScrollHeight={20} // Un pequeño margen extra arriba del teclado
      keyboardShouldPersistTaps="handled" // Para que al tocar fuera se cierre el teclado o funcionen los botones
      >
        
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <ProfileImageUploader
              imageUri={profilePhoto}
              onImageSelected={handleImageSelected}
              placeholder="Foto"
          />
          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 12}}>
             <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: mechanic.status === 'active' ? '#4CAF50' : '#F44336', marginRight: 8 }} />
             <Text style={styles.mechanicName}>{firstName} {lastName}</Text>
          </View>
          <Text style={styles.mechanicEmail}>{email}</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={handleFirstNameChange}
              placeholder="Nombre"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Apellido</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={handleLastNameChange}
              placeholder="Apellido"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              maxLength={15}
              placeholder="+56 9 ..."
            />
          </View>

          <Button 
            title={saving ? "Guardando..." : "Guardar Cambios"}
            onPress={handleSave}
            disabled={saving}
            style={styles.saveButton}
          />
        </View>

        {/* Stats / Reviews Section could go here */}

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Acciones</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleViewInspections}>
            <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="clipboard-outline" size={24} color="#2196F3" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Ver Inspecciones</Text>
              <Text style={styles.actionSubtitle}>Historial completo de trabajos</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleViewPayments}>
            <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="wallet-outline" size={24} color="#4CAF50" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Ver Pagos</Text>
              <Text style={styles.actionSubtitle}>Manejar transacciones y comprobantes</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Delete Section */}
        <View style={styles.deleteSection}>
          <Button 
            title={saving ? "Eliminando..." : "Eliminar Mecánico"}
            variant="danger"
            size="large"
            onPress={handleDeleteMechanic}
            disabled={saving}
            loading={saving}
            icon={!saving ? <Ionicons name="trash-outline" size={20} color="#FFF" /> : undefined}
            style={styles.deleteButton}
          />
        </View>

      </KeyboardAwareScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  backButton: { padding: 4 },
  content: { paddingBottom: 40 },
  
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#757575' },
  statusBadge: {
    position: 'absolute', bottom: 4, right: 4,
    width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: '#fff'
  },
  mechanicName: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  mechanicEmail: { fontSize: 14, color: '#666' },

  formSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: '#666', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 16, color: '#333',
  },
  saveButton: { marginTop: 8 },

  actionsSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 16,
  },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  actionSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },

  deleteSection: {
    padding: 16,
    backgroundColor: '#FFF8F8',
    borderTopWidth: 1,
    borderTopColor: '#FFE0E0',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0E0',
    marginBottom: 16,
  },
  deleteButton: {
    marginTop: 0,
  },
});
