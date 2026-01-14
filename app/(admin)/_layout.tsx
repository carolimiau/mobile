import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter, useSegments } from "expo-router";
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Platform
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import authService from '../../services/authService';
import apiService from '../../services/apiService';
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export default function AdminLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const fetchUnreadNotifications = async () => {
    try {
      const count = await apiService.getUnreadNotificationsCount();
      setUnreadNotificationsCount(count);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUnreadNotifications();
      // Poll every 5 seconds for admin to be responsive
      const interval = setInterval(fetchUnreadNotifications, 5000);
      return () => clearInterval(interval);
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            router.replace('/auth');
          }
        }
      ]
    );
  };

  const handleNotificationsPress = () => {
    router.push('/(admin)/notifications');
  };

  // No mostrar header en pantallas específicas
  const currentSegment = segments[segments.length - 1];
  const hideHeaderScreens = [
    'create-mechanic', 
    'mechanic-schedule', 
    'notifications', 
    'mechanic-detail', 
    'mechanic-inspections'
  ];
  const shouldHideHeader = hideHeaderScreens.includes(currentSegment);

  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#007bff" 
        translucent={false}
      />
      
      {/* Header para Admin - oculto en pantallas específicas */}
      {!shouldHideHeader && (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.appTitle}>AutoBox - Admin</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.headerIcon} onPress={handleNotificationsPress}>
                <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
                {unreadNotificationsCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIcon} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      )}

      <Tabs 
        screenOptions={{ 
          headerShown: false,
          tabBarActiveTintColor: '#007bff',
          tabBarInactiveTintColor: '#8e8e93',
        }}
      >
        <Tabs.Screen 
          name="mechanics" 
          options={{
            title: 'Mecánicos',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }} 
        />
        <Tabs.Screen 
          name="inspections" 
          options={{
            title: 'Inspecciones',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="clipboard" size={size} color={color} />
            ),
          }} 
        />
        <Tabs.Screen 
          name="publications" 
          options={{
            title: 'Publicaciones',
            tabBarIcon: ({ color, size }) => (
              <View>
                <Ionicons name="document-text" size={size} color={color} />
                {unreadNotificationsCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    right: -6,
                    top: -3,
                    backgroundColor: 'red',
                    borderRadius: 8,
                    width: 16,
                    height: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'white'
                  }}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }} 
        />
        <Tabs.Screen 
          name="settings" 
          options={{
            title: 'Ajustes',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }} 
        />
        <Tabs.Screen 
          name="payments" 
          options={{
            title: 'Pagos',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="wallet" size={size} color={color} />
            ),
          }} 
        />

        {/* Pantallas ocultas del TabBar */}
        <Tabs.Screen 
          name="create-mechanic" 
          options={{ 
            href: null,
            tabBarStyle: { display: 'none' }
          }} 
        />
        <Tabs.Screen 
          name="mechanic-schedule" 
          options={{ 
            href: null,
            tabBarStyle: { display: 'none' }
          }} 
        />
        <Tabs.Screen 
          name="sede-schedule" 
          options={{ 
            href: null,
            tabBarStyle: { display: 'none' }
          }} 
        />
        <Tabs.Screen 
          name="mechanic-detail" 
          options={{ 
            href: null,
            tabBarStyle: { display: 'none' }
          }} 
        />
        <Tabs.Screen 
          name="mechanic-inspections" 
          options={{ 
            href: null,
            tabBarStyle: { display: 'none' }
          }} 
        />
        <Tabs.Screen 
          name="notifications" 
          options={{
            title: 'Notificaciones',
            tabBarIcon: ({ color, size }) => (
              <View>
                <Ionicons name="notifications" size={size} color={color} />
                {unreadNotificationsCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    right: -6,
                    top: -3,
                    backgroundColor: 'red',
                    borderRadius: 8,
                    width: 16,
                    height: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'white'
                  }}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }} 
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#007bff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#007bff',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 16,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#007bff',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
