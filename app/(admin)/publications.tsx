import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import adminService from '../../services/adminService';

interface Publication {
  id: string;
  vehicleId: string;
  vehiclePatent: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  price: number;
  ownerName: string;
  ownerEmail: string;
  status: 'active' | 'sold' | 'inactive' | 'pending' | 'blocked';
  createdAt: string;
  expiresAt?: string;
  images?: string[];
  views?: number;
}

export default function AdminPublications() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'inactive' | 'blocked'>('all');
  const PAGE_SIZE = 10;

  useEffect(() => {
    loadPublications();
  }, []);

  useEffect(() => {
    loadPublications(1, true);
  }, [statusFilter]);

  const loadPublications = async (pageNum = 1, isRefreshing = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const offset = (pageNum - 1) * PAGE_SIZE;
      const response = await adminService.getAllPublications(
        statusFilter !== 'all' ? statusFilter : undefined,
        PAGE_SIZE,
        offset
      );

      const publicationsData = response.publications || [];
      const totalCount = response.total || 0;

      if (pageNum === 1 || isRefreshing) {
        setPublications(publicationsData);
      } else {
        setPublications(prev => [...prev, ...publicationsData]);
      }

      setTotal(totalCount);
      setHasMore(publicationsData.length === PAGE_SIZE && (pageNum * PAGE_SIZE) < totalCount);
      setPage(pageNum);
    } catch (error: any) {
      console.error('Error loading publications:', error);
      Alert.alert('Error', error.message || 'No se pudieron cargar las publicaciones');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPublications(1, true);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadPublications(page + 1);
    }
  };

  const handleToggleStatus = async (publicationId: string, currentStatus: string) => {
    let newStatus = 'active';

    if (currentStatus === 'blocked') {
      newStatus = 'active'; // restore blocked -> public
    } else if (currentStatus === 'active') {
      newStatus = 'inactive';
    } else if (currentStatus === 'inactive' || currentStatus === 'pending' || currentStatus === 'sold') {
      newStatus = 'active';
    }

    Alert.alert(
      'Cambiar Estado',
      `¿Deseas ${newStatus === 'active' ? 'publicar/restaurar' : 'desactivar'} esta publicación?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await adminService.updatePublicationStatus(publicationId, newStatus);
              loadPublications(1, true);
              Alert.alert('Éxito', 'Estado actualizado correctamente');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo actualizar el estado');
            }
          }
        }
      ]
    );
  };

  const handleDeletePublication = async (publicationId: string) => {
    Alert.alert(
      'Eliminar Publicación',
      "Eliminar una publicación la bloqueará (no se mostrará públicamente). ¿Deseas continuar?",
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.updatePublicationStatus(publicationId, 'blocked');
              loadPublications(1, true);
              Alert.alert('Éxito', 'Publicación bloqueada correctamente');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo bloquear la publicación');
            }
          }
        }
      ]
    );
  };

  const renderPublication = ({ item }: { item: Publication }) => {
    const statusColors = {
      active: '#4CAF50',
      sold: '#2196F3',
      inactive: '#9E9E9E',
      pending: '#FF9800',
      blocked: '#F44336',
    };

    const statusLabels = {
      active: 'Activada',
      sold: 'Vendida',
      inactive: 'Desactivada',
      pending: 'Pendiente',
      blocked: 'Bloqueada',
    };

    return (
      <View style={styles.publicationCard}>
        <View style={styles.publicationHeader}>
          <View style={styles.vehicleInfo}>
            {item.images && item.images.length > 0 ? (
              <Image source={{ uri: item.images[0] }} style={styles.vehicleImage} />
            ) : (
              <View style={[styles.vehicleImage, styles.noImage]}>
                <Ionicons name="car" size={32} color="#999" />
              </View>
            )}
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleTitle}>
                {item.vehicleBrand} {item.vehicleModel} {item.vehicleYear}
              </Text>
              <Text style={styles.vehiclePatent}>{item.vehiclePatent}</Text>
              <Text style={styles.ownerName}>{item.ownerName}</Text>
              <Text style={styles.price}>${item.price.toLocaleString('es-CL')}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] }]}>
            <Text style={styles.statusText}>{statusLabels[item.status]}</Text>
          </View>
        </View>

        <View style={styles.publicationStats}>
          <View style={styles.stat}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.statText}>
              {new Date(item.createdAt).toLocaleDateString('es-CL')}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.toggleButton]}
            onPress={() => handleToggleStatus(item.id, item.status)}
          >
            <Ionicons
              name={item.status === 'active' || item.status === 'blocked' ? 'play' : 'play'}
              size={18}
              color="#FFF"
            />
            <Text style={styles.actionButtonText}>
              {item.status === 'active' ? 'Desactivar' : item.status === 'blocked' ? 'Publicar' : 'Activar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeletePublication(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#FFF" />
            <Text style={styles.actionButtonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007bff" />
        <Text style={styles.footerText}>Cargando más publicaciones...</Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.totalText}>Total: {total} publicaciones</Text>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
          onPress={() => setStatusFilter('all')}
        >
          <Text style={[styles.filterChipText, statusFilter === 'all' && styles.filterChipTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, statusFilter === 'pending' && styles.filterChipActive]}
          onPress={() => setStatusFilter('pending')}
        >
          <Text style={[styles.filterChipText, statusFilter === 'pending' && styles.filterChipTextActive]}>
            Pendiente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, statusFilter === 'active' && styles.filterChipActive]}
          onPress={() => setStatusFilter('active')}
        >
          <Text style={[styles.filterChipText, statusFilter === 'active' && styles.filterChipTextActive]}>
            Activada
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, statusFilter === 'inactive' && styles.filterChipActive]}
          onPress={() => setStatusFilter('inactive')}
        >
          <Text style={[styles.filterChipText, statusFilter === 'inactive' && styles.filterChipTextActive]}>
            Desactivada
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, statusFilter === 'blocked' && styles.filterChipActive]}
          onPress={() => setStatusFilter('blocked')}
        >
          <Text style={[styles.filterChipText, statusFilter === 'blocked' && styles.filterChipTextActive]}>
            Bloqueada
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && page === 1) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Cargando publicaciones...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={publications}
        keyExtractor={(item) => item.id}
        renderItem={renderPublication}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No hay publicaciones</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007bff" />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  headerContainer: {
    marginBottom: 16,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  publicationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  publicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vehicleInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  vehicleImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  noImage: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  vehiclePatent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  publicationStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  toggleButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
});
