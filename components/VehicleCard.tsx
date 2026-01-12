import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/apiService';
import { getImageUrl } from '../utils/imageUtils';

const { width } = Dimensions.get('window');

interface VehicleCardProps {
  vehicle: any;
  onPress: () => void;
  isActive?: boolean;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onPress,
  isActive = false
}) => {
  console.log('VehicleCard render - vehicle:', vehicle.id, 'valor:', vehicle.valor, 'price:', vehicle.price);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const videoRef = useRef<Video>(null);
  
  // Combine media
  const allMedia: { type: 'image' | 'video'; uri: string }[] = [];
  
  if (vehicle.videoUrl) {
    allMedia.push({ type: 'video', uri: getImageUrl(vehicle.videoUrl) });
  }
  if (vehicle.videos && Array.isArray(vehicle.videos)) {
    vehicle.videos.forEach((uri: string) => allMedia.push({ type: 'video', uri: getImageUrl(uri) }));
  }
  if (vehicle.images && Array.isArray(vehicle.images)) {
    vehicle.images.forEach((uri: string) => allMedia.push({ type: 'image', uri: getImageUrl(uri) }));
  }
  
  const currentMedia = allMedia[currentMediaIndex] || { type: 'image', uri: '' };

  // Auto-play carousel if active
  useEffect(() => {
    let interval: any;
    if (isActive && allMedia.length > 1) {
      interval = setInterval(() => {
        setCurrentMediaIndex(prev => (prev + 1) % allMedia.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isActive, allMedia.length]);

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.mediaContainer}>
        {currentMedia.type === 'video' ? (
          <Video
            ref={videoRef}
            source={{ uri: currentMedia.uri }}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay={isActive}
            isMuted={true}
          />
        ) : currentMedia.uri ? (
          <Image 
            source={{ uri: currentMedia.uri }} 
            style={styles.media}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.media, styles.placeholder]}>
            <Ionicons name="car-sport" size={64} color="#CCC" />
          </View>
        )}
        
        <View style={styles.overlay}>
          <View style={styles.infoContainer}>
            <Text style={styles.modelText}>
              {vehicle.marca} {vehicle.modelo} {vehicle.anio}
            </Text>
            <Text style={styles.priceText}>
              ${((vehicle.valor || vehicle.price) || 0).toLocaleString('es-CL')}
            </Text>
            
            <View style={styles.statusBadge}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {vehicle.estado === 'Publicada_Verificada' && (
                  <View style={{
                    backgroundColor: '#1E90FF', // Azul tipo Instagram
                    borderRadius: 10,
                    width: 16,
                    height: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Ionicons name="checkmark" size={10} color="#FFF" />
                  </View>
                )}
                <Text style={styles.statusText}>
                  {apiService.getStatusText(vehicle.estado || 'available')}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="speedometer-outline" size={16} color="#FFF" />
              <Text style={styles.statText}>{(vehicle.kilometraje || vehicle.kilometers || 0).toLocaleString('es-CL')} km</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="location-outline" size={16} color="#FFF" />
              <Text style={styles.statText}>{vehicle.comuna || 'Santiago'}</Text>
            </View>
          </View>
        </View>
        
        {allMedia.length > 1 && (
          <View style={styles.pagination}>
            {allMedia.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.dot, 
                  index === currentMediaIndex && styles.activeDot
                ]} 
              />
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginHorizontal: 16,
  },
  mediaContainer: {
    height: 250,
    width: '100%',
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  infoContainer: {
    marginBottom: 8,
  },
  modelText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  priceText: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statusBadge: {
    position: 'absolute',
    top: -200, // Move to top right
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  pagination: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeDot: {
    backgroundColor: '#FFF',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
