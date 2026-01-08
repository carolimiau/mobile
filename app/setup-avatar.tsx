import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../components/ui/Screen';
import { Button } from '../components/ui/Button';
import { ImageUploader } from '../components/ui/ImageUploader';
import authService from '../services/authService';
import { User } from '../types';

export default function SetupAvatarScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await authService.getUser();
    setUser(currentUser);
  };

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  const handleUploadComplete = async (files: any[]) => {
    if (files.length > 0 && user) {
      setLoading(true);
      try {
        const photoUrl = files[0].url;
        await authService.updateProfileData(user.id, { foto_url: photoUrl });
        Alert.alert('Éxito', 'Foto de perfil actualizada');
      } catch (error: any) {
        console.error(error);
        Alert.alert('Error', error.message || 'No se pudo actualizar la foto de perfil');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!user) return (
    <Screen backgroundColor="#FFFFFF">
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
        </View>
    </Screen>
  );

  return (
    <Screen backgroundColor="#FFFFFF">
      <View style={styles.container}>
        <Text style={styles.title}>¡Bienvenido, {user.primerNombre}!</Text>
        <Text style={styles.subtitle}>
          Para terminar, sube una foto de perfil para que te reconozcan.
        </Text>

        <View style={styles.uploaderContainer}>
            <ImageUploader
                folder="avatars"
                maxImages={1}
                onUploadComplete={handleUploadComplete}
                initialImages={user.foto_url ? [user.foto_url] : []}
            />
        </View>

        <View style={styles.footer}>
          <Button title="Continuar" onPress={handleContinue} loading={loading} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  uploaderContainer: {
    marginBottom: 32,
    width: '100%',
    alignItems: 'center',
    height: 200, // Altura fija para el uploader
  },
  footer: {
    width: '100%',
    marginTop: 20,
  },
});
