import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { useNotifications } from '../../hooks/useNotifications';
import apiService from '../../services/apiService';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, loading, refresh, markAsRead } = useNotifications();

  const getIconConfig = (type: string) => {
    switch (type) {
      case 'crear_insp':
      case 'crear_pub_insp':
        return { name: 'car-sport', color: '#2196F3', bg: '#E3F2FD' };
      case 'crear_pub':
        return { name: 'pricetag', color: '#4CAF50', bg: '#E8F5E9' };
      case 'agendar_admin':
      case 'agendar_dueno':
      case 'agendar_vend':
      case 'reagendar_vend':
      case 'reagendar_dueno':
        return { name: 'calendar', color: '#FF9800', bg: '#FFF3E0' };
      case 'solicitar_mec':
        return { name: 'construct', color: '#2196F3', bg: '#E3F2FD' };
      case 'rechazo_mec':
      case 'cancelado_admin':
      case 'cancelado_mec':
      case 'cancelado_vend':
        return { name: 'alert-circle', color: '#F44336', bg: '#FFEBEE' };
      case 'aceptar_mec_admin':
      case 'aceptar_mec_vend':
      case 'aceptar_mec_dueno':
        return { name: 'checkmark-circle', color: '#4CAF50', bg: '#E8F5E9' };
      case 'finalizado_vend':
      case 'finalizado_dueno':
      case 'finalizado_mec':
      case 'finalizado_admin':
        return { name: 'flag', color: '#4CAF50', bg: '#E8F5E9' };
      default:
        return { name: 'notifications', color: '#757575', bg: '#EEEEEE' };
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Menos de 1 hora
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `Hace ${minutes} min`;
    }
    // Menos de 24 horas
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `Hace ${hours} h`;
    }
    // Ayer
    if (diff < 172800000) {
      return 'Ayer';
    }
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
  };

  const handleNotificationPress = async (item: any) => {
    markAsRead(item.id);

    // Verificar si la inspección está pendiente sin mecánico asignado
    if (item.relatedId && ['crear_insp', 'crear_pub_insp', 'solicitar_mec'].includes(item.type)) {
      try {
        const inspection = await apiService.getInspectionById(item.relatedId);
        if (inspection && inspection.estado_insp === 'Pendiente' && !inspection.mecanicoId) {
          Alert.alert(
            'Solicitud Pendiente',
            'Tu solicitud ha sido recibida y está a la espera de ser asignada a un mecánico. Te notificaremos cuando alguien acepte tu solicitud.'
          );
          return;
        }
      } catch (e) {
        console.error('Error verificando estado de inspección:', e);
      }
    }
    
    if (item.actionUrl) {
      try {
        // Handle relative paths manually if needed, or let router.push handle it
        // router.push expects a path like "/path" or an object
        router.push(item.actionUrl);
        return;
      } catch (e) {
        console.error('Error navigating to actionUrl:', e);
      }
    }

    // Fallback navigation logic based on type
    if (item.relatedId) {
        if (
            item.type === 'aceptar_mec_dueno' || 
            item.type === 'aceptar_mec_vend' || 
            item.type === 'finalizado_dueno' || 
            item.type === 'finalizado_vend' ||
            item.type === 'cancelado_dueno' ||
            item.type === 'cancelado_vend' ||
            item.type === 'cancelado_mec'
        ) {
            router.push({
                pathname: '/user-inspection-detail',
                params: { id: item.relatedId }
            });
        }
    }
  };

  const renderNotification = ({ item }: { item: any }) => {
    const iconConfig = getIconConfig(item.type);
    
    return (
      <TouchableOpacity 
        style={[styles.notificationItem, !item.read && styles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
          <Ionicons name={iconConfig.name as any} size={24} color={iconConfig.color} />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, !item.read && styles.unreadText]}>{item.title}</Text>
            <Text style={styles.date}>{formatTime(item.createdAt)}</Text>
          </View>
          <Text style={styles.message}>{item.message}</Text>
          {/* Display cancellation reason if available in message or metadata */}
        </View>
        {!item.read && <View style={styles.dot} />}
      </TouchableOpacity>
    );
  };

  return (
    <Screen backgroundColor="#F8F9FA">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotification}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#2196F3" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="notifications-off-outline" size={48} color="#9E9E9E" />
            </View>
            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
            <Text style={styles.emptyText}>Te avisaremos cuando haya novedades importantes.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unreadItem: {
    backgroundColor: '#F0F7FF',
    borderColor: '#E3F2FD',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    color: '#000',
    fontWeight: '700',
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    marginLeft: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
});
