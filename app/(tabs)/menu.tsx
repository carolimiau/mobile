import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import authService from '../../services/authService';

export default function MenuScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              router.replace('/auth');
            } catch {
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Mi Perfil',
      subtitle: 'Ver y editar información personal',
      onPress: () => router.push('/profile'),
    },
    {
      icon: 'wallet-outline',
      title: 'Billetera',
      subtitle: 'Saldo y transacciones',
      onPress: () => router.push('/(tabs)/wallet'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Ayuda y Soporte',
      subtitle: 'Centro de ayuda',
      onPress: () => Alert.alert('Ayuda y Soporte', 'Contáctanos en:\n\nCorreo: soporte@autobox.cl\nTeléfono: +56 9 1234 5678'),
    },
    {
      icon: 'information-circle-outline',
      title: 'Acerca de',
      subtitle: 'Versión 1.0.0',
      onPress: () => Alert.alert('AutoBox', 'Versión 1.0.0\n\n© 2026 AutoBox'),
    },
    {
      icon: 'log-out-outline',
      title: 'Cerrar Sesión',
      subtitle: 'Salir de tu cuenta',
      onPress: handleLogout,
      isDanger: true,
    },
  ];

  return (
    <Screen backgroundColor="#F5F5F5" edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Menú</Text>
      </View>

      <ScrollView contentContainerStyle={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.menuItem,
              item.isDanger && styles.menuItemDanger,
            ]}
            onPress={item.onPress}
          >
            <View style={styles.menuItemLeft}>
              <View style={[
                styles.iconContainer,
                item.isDanger && styles.iconContainerDanger,
              ]}>
                <Ionicons 
                  name={item.icon as any} 
                  size={24} 
                  color={item.isDanger ? '#F44336' : '#4CAF50'} 
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[
                  styles.itemTitle,
                  item.isDanger && styles.itemTitleDanger,
                ]}>
                  {item.title}
                </Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={item.isDanger ? '#F44336' : '#BDBDBD'} 
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  menuContainer: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemDanger: {
    backgroundColor: '#FFEBEE',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainerDanger: {
    backgroundColor: '#FFCDD2',
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  itemTitleDanger: {
    color: '#D32F2F',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#757575',
  },
});
