import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import adminService, { Mechanic } from '../../services/adminService';

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
  const [specialization, setSpecialization] = useState('');
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
      setSpecialization(data.specialization || '');
      setEmail(data.email || '');

    } catch (error) {
      console.error('Error loading mechanic:', error);
      Alert.alert('Error', 'No se pudo cargar la información del mecánico');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!mechanic) return;
    try {
      setSaving(true);
      await adminService.updateMechanic(mechanic.id, {
        firstName,
        lastName,
        phone,
        specialization,
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
    <Screen style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil del Mecánico</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {mechanic.profilePhoto ? (
              <Image source={{ uri: mechanic.profilePhoto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {firstName?.[0]}{lastName?.[0]}
                </Text>
              </View>
            )}
            <View style={[styles.statusBadge, { backgroundColor: mechanic.status === 'active' ? '#4CAF50' : '#F44336' }]} />
          </View>
          <Text style={styles.mechanicName}>{firstName} {lastName}</Text>
          <Text style={styles.mechanicEmail}>{email}</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Nombre"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Apellido</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Apellido"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+56 9 ..."
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Especialización</Text>
            <TextInput
              style={styles.input}
              value={specialization}
              onChangeText={setSpecialization}
              placeholder="Ej: Motores Diesel, Suspensión..."
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

          {/* Add more actions if needed, e.g. View Schedule */}
        </View>

      </ScrollView>
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
});
