import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/ui/Screen';
import { VehicleCard } from '../components/VehicleCard';
import { FilterModal, FilterState } from '../components/FilterModal';
import apiService from '../services/apiService';
import searchHistoryService from '../services/searchHistoryService';

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});

  useEffect(() => {
    performSearch();
  }, []);

  const performSearch = async (query = searchQuery, currentFilters = filters) => {
    setLoading(true);
    try {
      const searchFilters = {
        ...currentFilters,
        search: query || currentFilters.search,
      };
      const results = await apiService.getPublications(searchFilters);
      setVehicles(results);
      
      // Guardar en historial de búsqueda
      await searchHistoryService.saveSearch(
        {
          search: query,
          ...currentFilters,
        },
        results.length
      );
    } catch (error) {
      console.error('Error searching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    performSearch(searchQuery, filters);
  };

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    performSearch(searchQuery, newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
    setSearchQuery('');
    performSearch('', {});
  };

  const handleVehiclePress = (vehicle: any) => {
    router.push({ pathname: '/vehicle-preview', params: { id: vehicle.id } });
  };

  const renderItem = ({ item }: { item: any }) => (
    <VehicleCard
      vehicle={item}
      onPress={() => handleVehiclePress(item)}
      isActive={false}
    />
  );

  return (
    <Screen backgroundColor="#F5F5F5">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Buscar Vehículos</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              placeholder="Buscar marca, modelo..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="options-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Active Filters */}
        {Object.keys(filters).some(key => filters[key as keyof FilterState]) && (
          <View style={styles.activeFiltersContainer}>
            <Text style={styles.activeFiltersLabel}>Filtros activos:</Text>
            <TouchableOpacity onPress={handleResetFilters}>
              <Text style={styles.clearFiltersText}>Limpiar todo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        ) : (
          <FlatList
            data={vehicles}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="car-sport-outline" size={64} color="#CCC" />
                <Text style={styles.emptyText}>No se encontraron vehículos</Text>
                <Text style={styles.emptySubtext}>
                  Intenta ajustar los filtros o buscar algo diferente
                </Text>
              </View>
            }
            ListHeaderComponent={
              vehicles.length > 0 ? (
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsText}>
                    {vehicles.length} vehículo{vehicles.length !== 1 ? 's' : ''} encontrado{vehicles.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              ) : null
            }
          />
        )}

        {/* Filter Modal */}
        <FilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          currentFilters={filters}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E8F5E9',
  },
  activeFiltersLabel: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  listContent: {
    paddingVertical: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
