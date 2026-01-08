import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/ui/Screen';

const { width } = Dimensions.get('window');

export default function LoadingScreen() {
  const carPosition = useRef(new Animated.Value(-100)).current;
  const wheelRotation = useRef(new Animated.Value(0)).current;
  const bounceAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Car movement animation
    const carMovement = Animated.loop(
      Animated.timing(carPosition, {
        toValue: width + 100,
        duration: 3000,
        useNativeDriver: true,
      })
    );

    // Wheel spinning animation
    const wheelSpinning = Animated.loop(
      Animated.timing(wheelRotation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    );

    // Car bounce animation
    const carBounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ])
    );

    carMovement.start();
    wheelSpinning.start();
    carBounce.start();

    return () => {
      carMovement.stop();
      wheelSpinning.stop();
      carBounce.stop();
    };
  }, []);

  const spin = wheelRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const bounce = bounceAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  return (
    <Screen backgroundColor="#FFFFFF" style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.carContainer,
            {
              transform: [
                { translateX: carPosition },
                { translateY: bounce }
              ],
            },
          ]}
        >
          <Ionicons name="car-sport" size={80} color="#4CAF50" />
          <View style={styles.wheelsContainer}>
            <Animated.View style={[styles.wheel, { transform: [{ rotate: spin }] }]}>
              <Ionicons name="settings" size={24} color="#333" />
            </Animated.View>
            <Animated.View style={[styles.wheel, { transform: [{ rotate: spin }] }]}>
              <Ionicons name="settings" size={24} color="#333" />
            </Animated.View>
          </View>
        </Animated.View>

        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  carContainer: {
    marginBottom: 40,
  },
  wheelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 60,
    position: 'absolute',
    bottom: 5,
    left: 10,
  },
  wheel: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
  },
});
