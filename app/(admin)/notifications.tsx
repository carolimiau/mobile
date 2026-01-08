import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../services/apiService';
import { Screen } from '../../components/ui/Screen';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: any;
  relatedId?: string;
}

const NotificationItem = ({ 
  item, 
  onPress 
}: { 
  item: Notification, 
  onPress: (n: Notification) => void 
}) => {
  const cleanMessage = (msg: string) => {
    // Remove UUIDs and clean up text
    return msg.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '')
              .replace(/ID:\s*/i, '')
              .replace(/\s+/g, ' ')
              .trim();
  };

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
      case 'cancelado_dueno':
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

  const iconConfig = getIconConfig(item.type);

  return (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
        <Ionicons 
          name={iconConfig.name as any} 
          size={24} 
          color={iconConfig.color} 
        />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.itemTitle, !item.isRead && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.time}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
        <Text style={styles.message}>
          {cleanMessage(item.message)}
        </Text>
      </View>
      {!item.isRead && <View style={styles.dot} />}
    </TouchableOpacity>
  );
};

export default function AdminNotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await apiService.get('/notifications');
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await apiService.patch(`/notifications/${notification.id}/read`);
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
      }

      // Handle navigation based on type
      const inspectionId = notification.relatedId || notification.metadata?.inspectionId;

      if (inspectionId && (
          notification.type === 'crear_insp' || 
          notification.type === 'crear_pub_insp' || 
          notification.type === 'inspection_request' || 
          notification.type === 'inspection' ||
          notification.type === 'agendar_admin' ||
          notification.type === 'admin_alert' ||
          notification.type === 'inspection_completed'
        )) {
        // Navigate to inspection details
        router.push({
          pathname: '/(admin)/inspections',
          params: { highlightId: inspectionId }
        });
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Notificaciones</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem 
              item={item} 
              onPress={handleNotificationPress} 
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2196F3" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="notifications-off-outline" size={48} color="#9E9E9E" />
              </View>
              <Text style={styles.emptyTitle}>Sin notificaciones</Text>
              <Text style={styles.emptyText}>No hay alertas pendientes.</Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    color: '#007bff',
    fontWeight: '700',
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  time: {
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
