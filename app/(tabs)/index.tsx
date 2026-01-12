import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text,
  Image,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { VehicleCard } from '../../components/VehicleCard';
import { useVehicleFeed } from '../../hooks/useVehicleFeed';
import { useMyPublications } from '../../hooks/useMyPublications';
import { useFavorites } from '../../hooks/useFavorites';
import { useWallet } from '../../hooks/useWallet';
import authService from '../../services/authService';
import { getImageUrl } from '../../utils/imageUtils';

const { width } = Dimensions.get('window');

// --- Components ---

const HomeHeader = ({ user, balance }: { user: any, balance: number }) => (
  <View style={styles.headerContainer}>
    <View style={styles.userInfo}>
      <View style={styles.avatarContainer}>
        {user?.foto_url ? (
          <Image source={{ uri: getImageUrl(user.foto_url) }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitials}>
              {user?.primerNombre?.[0] || user?.email?.[0] || '?'}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>Hola,</Text>
        <Text style={styles.userName}>{user?.primerNombre || 'Usuario'}</Text>
      </View>
    </View>
    
    <View style={styles.balanceContainer}>
      <Text style={styles.balanceLabel}>Saldo AutoBox</Text>
      <Text style={styles.balanceAmount}>
        ${balance.toLocaleString('es-CL')}
      </Text>
    </View>
  </View>
);

const TabSelector = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) => {
  const tabs = [
    { id: 'latest', label: 'Últimos', icon: 'time-outline' },
    { id: 'publications', label: 'Mis Publicaciones', icon: 'car-sport-outline' },
    { id: 'favorites', label: 'Favoritos', icon: 'heart-outline' },
  ];

  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tabItem, activeTab === tab.id && styles.activeTabItem]}
          onPress={() => onTabChange(tab.id)}
        >
          <Ionicons 
            name={tab.icon as any} 
            size={20} 
            color={activeTab === tab.id ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// --- Main Screen ---

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { balance, refresh: refreshWallet } = useWallet();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('latest');

  // Handle tab param
  useEffect(() => {
    if (params.tab && typeof params.tab === 'string' && ['latest', 'publications', 'favorites'].includes(params.tab)) {
      setActiveTab(params.tab);
    }
  }, [params.tab]);
  
  // Data Hooks
  const latestFeed = useVehicleFeed();
  const myPublications = useMyPublications();
  const favorites = useFavorites();

  // Load User Data
  useEffect(() => {
    loadUserData();
  }, []);

  // Refresh user when screen gains focus (e.g., after editing profile)
  useFocusEffect(
    useCallback(() => {
      loadUserData();
      return () => {};
    }, [])
  );

  // Load Tab Data when tab changes
  useEffect(() => {
    if (activeTab === 'publications') {
      myPublications.loadMore();
    } else if (activeTab === 'favorites') {
      favorites.loadMore();
    }
  }, [activeTab]);

  const loadUserData = async () => {
    try {
      const userData = await authService.getUser();
      setUser(userData);
      refreshWallet();
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'latest') {
      latestFeed.onRefresh();
    } else if (activeTab === 'publications') {
      myPublications.onRefresh();
    } else if (activeTab === 'favorites') {
      favorites.onRefresh();
    }
    refreshWallet(); // Always refresh wallet on pull down
  };

  const handleVehiclePress = (vehicle: any) => {
    // Abrir vista previa en pantalla completa con TTS
    router.push({ pathname: '/vehicle-preview', params: { id: vehicle.id } });
  };

  const renderItem = ({ item }: { item: any }) => (
    <VehicleCard
      vehicle={item}
      onPress={() => handleVehiclePress(item)}
      isActive={false}
    />
  );

  const renderFooter = () => {
    return null;
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'publications': return myPublications.vehicles;
      case 'favorites': return favorites.vehicles;
      case 'latest': default: return latestFeed.vehicles;
    }
  };

  const getLoadingState = () => {
    switch (activeTab) {
      case 'publications': return myPublications.loading;
      case 'favorites': return favorites.loading;
      case 'latest': default: return latestFeed.loading;
    }
  };

  const getRefreshingState = () => {
    switch (activeTab) {
      case 'publications': return myPublications.refreshing;
      case 'favorites': return favorites.refreshing;
      case 'latest': default: return latestFeed.refreshing;
    }
  };

  const getLoadMoreFunc = () => {
    switch (activeTab) {
      case 'publications': return myPublications.loadMore;
      case 'favorites': return favorites.loadMore;
      case 'latest': default: return latestFeed.loadMore;
    }
  };

  return (
    <Screen backgroundColor="#F5F5F5">
      <View style={styles.container}>
        <HomeHeader user={user} balance={balance} />
        <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />
        
        {getLoadingState() && !getRefreshingState() && getCurrentData().length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        ) : (
          <FlatList
            data={getCurrentData()}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={getRefreshingState()} onRefresh={handleRefresh} colors={['#4CAF50']} />
            }
            onEndReached={getLoadMoreFunc()}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>
                  {activeTab === 'publications' ? 'No has publicado vehículos aún' :
                   activeTab === 'favorites' ? 'No tienes vehículos favoritos aún' :
                   'No hay vehículos disponibles'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header Styles
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  avatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#757575',
  },
  greetingContainer: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  balanceContainer: {
    alignItems: 'flex-end',
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C5E1A5',
  },
  balanceLabel: {
    fontSize: 10,
    color: '#689F38',
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: '#4CAF50',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  // List Styles
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  listContent: {
    paddingVertical: 8,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
