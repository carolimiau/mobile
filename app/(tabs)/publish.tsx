import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';

export default function PublishScreen() {
  const router = useRouter();

  const publishOptions = [
    {
      id: 'with-inspection',
      title: 'Publicación con Revisión Técnica',
      description: 'Publica tu auto con certificación de inspección mecánica incluida para mayor confianza del comprador',
      icon: 'checkmark-circle',
      iconColor: '#4CAF50',
      backgroundColor: '#F1F8E9',
      borderColor: '#4CAF50',
      route: '/publish-with-inspection'
    },
    {
      id: 'own-publication',
      title: 'Publicación Propia',
      description: 'Crea tu propia publicación con fotos y descripción personalizada sin servicios adicionales',
      icon: 'create',
      iconColor: '#2196F3',
      backgroundColor: '#E3F2FD',
      borderColor: '#2196F3',
      route: '/raw-publish'
    }
  ];

  return (
    <Screen backgroundColor="#F0F2F5" edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="car-sport" size={56} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Vender Auto</Text>
          <Text style={styles.subtitle}>
            Elige la mejor opción para vender tu vehículo
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {publishOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => router.push(option.route as any)}
              activeOpacity={0.8}
            >
              <Card style={[styles.optionCard, { borderLeftColor: option.borderColor, borderLeftWidth: 4 }]}>
                <View style={styles.optionHeader}>
                  <View style={[
                    styles.iconContainer,
                    { backgroundColor: option.backgroundColor }
                  ]}>
                    <Ionicons 
                      name={option.icon as any} 
                      size={32} 
                      color={option.iconColor} 
                    />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={24} 
                    color="#65676B" 
                  />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 24,
  },
  headerIconContainer: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  optionsContainer: {
    padding: 16,
    gap: 16,
  },
  optionCard: {
    padding: 16,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
    marginRight: 8,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1E21',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#65676B',
    lineHeight: 20,
  },
});
