import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import adminService from '../../services/adminService';
import { User } from '../../types';

export default function UsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter only regular users? Or show all including mechanics/admins?
  // User requested "todos los usuarios" but usually distinct from mechanics tab.
  // I will filter by role 'Usuario' if needed, but let's show all and display role badges.

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers();
      // Ensure we have an array
      let usersList = [];
      if (Array.isArray(data)) {
        usersList = data;
      } else if (data && data.usuarios) {
          // If the endpoint returns { usuarios: [], mecanicos: [], ... }
          usersList = [...(data.usuarios || []), ...(data.mecanicos || []), ...(data.administradores || [])];
      }
      
      // Filter only regular users as requested
      const regularUsers = usersList.filter((u: any) => u.rol === 'Usuario');
      
      setUsers(regularUsers as User[]);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleUserPress = (user: User) => {
    router.push({
      pathname: '/(admin)/user-detail',
      params: { id: user.id }
    });
  };

  const getRoleBadge = (role: string) => {
      let color = '#757575';
      let label = 'Usuario';
      
      switch(role) {
          case 'Administrador': color = '#F44336'; label = 'Admin'; break;
          case 'Mecánico': color = '#2196F3'; label = 'Mecánico'; break;
          case 'Usuario': color = '#4CAF50'; label = 'Usuario'; break;
      }

      return (
          <View style={[styles.roleBadge, { backgroundColor: color }]}>
              <Text style={styles.roleText}>{label}</Text>
          </View>
      );
  };

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleUserPress(item)}>
        <View style={styles.row}>
            <View style={styles.avatarContainer}>
                {item.foto_url ? (
                    <Image source={{ uri: item.foto_url }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                         <Text style={styles.avatarInitial}>{item.primerNombre?.[0] || item.email?.[0] || '?'}</Text>
                    </View>
                )}
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>
                    {item.primerNombre} {item.primerApellido}
                </Text>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.phone}>{item.telefono || 'Sin teléfono'}</Text>
            </View>
            <View style={styles.right}>
                {getRoleBadge(item.rol)}
                <Ionicons name="chevron-forward" size={20} color="#ccc" style={{ marginTop: 8 }} />
            </View>
        </View>
    </TouchableOpacity>
  );

  return (
    <Screen backgroundColor="#F5F5F5">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
           ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No hay usuarios registrados</Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  listContent: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: { 
      width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0E0E0', 
      justifyContent: 'center', alignItems: 'center' 
  },
  avatarInitial: { fontSize: 20, fontWeight: 'bold', color: '#757575' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  email: { fontSize: 14, color: '#666' },
  phone: { fontSize: 13, color: '#999' },
  right: { alignItems: 'flex-end', justifyContent: 'space-between' },
  roleBadge: {
      paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8
  },
  roleText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  emptyText: { color: '#999', fontSize: 16 }
});
