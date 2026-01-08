import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import authService from '../services/authService';
import { registerForPushNotificationsAsync } from '../services/pushNotificationService';
import { UserRole } from '../types';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        // Try to refresh profile from backend to get latest role
        let user = await authService.refreshProfile();
        
        // Fallback to local storage if refresh fails (e.g. offline)
        if (!user) {
          user = await authService.getUser();
        }

        // Register for push notifications in background
        registerForPushNotificationsAsync().catch(err => 
          console.error('Error registering push token:', err)
        );

        const userRole = user?.rol;
        console.log('👤 [INDEX] User Role:', userRole);
        
        // Normalizar el rol para evitar problemas de encoding o espacios
        const role = String(userRole || '').trim();
        
        // DEBUG: Mostrar alerta si el rol no es reconocido claramente
        // if (role !== 'Administrador' && role !== 'Mecánico' && role !== 'Usuario') {
        //   Alert.alert('Debug Index', `Rol detectado: "${role}"`);
        // }

        if (role === 'Administrador' || role === UserRole.ADMIN) {
          console.log('👉 Redirecting to Admin Dashboard');
          router.replace('/(admin)/mechanics');
        } else if (role === 'Mecánico' || role === 'Mecanico' || role === UserRole.MECHANIC) {
          console.log('👉 Redirecting to Mechanic Dashboard');
          router.replace('/(mechanic)');
        } else {
          console.log('👉 Redirecting to User Tabs');
          router.replace('/(tabs)');
        }
      } else {
        router.replace('/auth');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/auth');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4CAF50" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
