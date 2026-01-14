import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
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
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: any;
  relatedId?: string;
}

const NotificationItem = ({ 
  item, 
  onPress,
}: { 
  item: Notification, 
  onPress: (n: Notification) => void,
}) => {
  const cleanMessage = (msg: string) => {
    return msg.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '')
              .replace(/ID:\s*/i, '')
              .replace(/\s+/g, ' ')
              .trim();
  };

  return (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadItem]}
      onPress={() => onPress(item)}
    >
      <View style={[styles.iconContainer, !item.read && styles.unreadIconContainer]}>
        <Ionicons 
          name={(item.type === 'inspection_request' || item.type === 'solicitar_mec') ? 'car-sport' : 
                (item.type === 'cancelado_mec' || item.type === 'cancelado_admin' || item.type === 'cancelado_dueno') ? 'alert-circle' : 'notifications'} 
          size={24} 
          color={item.read ? '#757575' : (item.type === 'cancelado_mec' || item.type === 'cancelado_admin' || item.type === 'cancelado_dueno') ? '#F44336' : '#FF9800'} 
        />
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.itemTitle, !item.read && styles.unreadTitle]}>
          {item.title}
        </Text>
        <Text style={styles.message}>
          {cleanMessage(item.message)}
        </Text>
        <Text style={styles.time}>
          {new Date(item.createdAt).toLocaleString('es-CL')}
        </Text>
      </View>
      {!item.read && <View style={styles.dot} />}
    </TouchableOpacity>
  );
};

export default function MechanicNotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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
      if (!notification.read) {
        await apiService.patch(`/notifications/${notification.id}/read`);
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
      }

      // Check if already handled based on message content
      if (notification.message.startsWith('Has aceptado') || notification.message.startsWith('Has rechazado')) {
        return;
      }

      // Check if we have relatedId directly or in metadata
      const relatedId = notification.relatedId || notification.metadata?.relatedId || notification.metadata?.inspectionId;
      
      if ((notification.type === 'inspection_request' || notification.type === 'solicitar_mec') && relatedId) {
        // Ensure we have the ID in metadata for the modal to use
        const notificationWithMetadata = {
          ...notification,
          metadata: {
            ...notification.metadata,
            relatedId: relatedId,
            inspectionId: relatedId // For backward compatibility in modal logic
          }
        };
        setSelectedNotification(notificationWithMetadata);
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const handleAccept = async () => {
    if (!selectedNotification?.metadata?.inspectionId) return;
    
    try {
      // Assuming the relatedId in notification is the Solicitud ID for 'solicitar_mec'
      // But the endpoint expects inspectionId? Or SolicitudId?
      // The backend controller uses `respondRequest` with `id` being the Solicitud ID.
      // Let's check if metadata has relatedId or inspectionId.
      // In inspections.service.ts: relatedId: savedSolicitud.id
      // So we should use relatedId if type is solicitar_mec
      
      const requestId = selectedNotification.metadata?.relatedId || selectedNotification.metadata?.id || selectedNotification.metadata?.inspectionId;
      
      // If it's the new flow using SolicitudInspeccion
      if (selectedNotification.type === 'solicitar_mec') {
         await apiService.patch(`/inspections/requests/${selectedNotification.metadata.relatedId}/respond`, { estado: 'aceptada' });
      } else {
         // Fallback for old flow if any
         await apiService.post(`/inspections/${selectedNotification.metadata.inspectionId}/accept`);
      }

      Alert.alert('Éxito', 'Has aceptado la inspección');
      setModalVisible(false);
      loadNotifications(); 
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo aceptar la inspección');
    }
  };

  const handleReject = async () => {
    if (!selectedNotification?.metadata?.inspectionId) return;

    try {
      if (selectedNotification.type === 'solicitar_mec') {
         await apiService.patch(`/inspections/requests/${selectedNotification.metadata.relatedId}/respond`, { estado: 'rechazada' });
      } else {
         await apiService.post(`/inspections/${selectedNotification.metadata.inspectionId}/reject`);
      }

      Alert.alert('Éxito', 'Has rechazado la inspección');
      setModalVisible(false);
      loadNotifications();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo rechazar la inspección');
    }
  };

  return (
    <Screen style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF9800']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No tienes notificaciones</Text>
            </View>
          }
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Solicitud de Inspección</Text>
            <Text style={styles.modalMessage}>
              {selectedNotification?.message}
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.rejectButton]} 
                onPress={handleReject}
              >
                <Text style={styles.actionText}>Rechazar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.acceptButton]} 
                onPress={handleAccept}
              >
                <Text style={[styles.actionText, styles.acceptText]}>Aceptar</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 0,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    alignItems: 'flex-start',
  },
  unreadItem: {
    backgroundColor: '#FFF8E1', // Light orange tint
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  unreadIconContainer: {
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  unreadTitle: {
    color: '#E65100', // Darker orange
    fontWeight: '700',
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9800',
    marginTop: 6,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    marginBottom: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  rejectButton: {
    borderColor: '#F44336',
    backgroundColor: '#FFF',
  },
  acceptButton: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },
  acceptText: {
    color: '#FFF',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#999',
    fontSize: 14,
  },
});
