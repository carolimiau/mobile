import { Platform } from 'react-native';
import * as Device from 'expo-device';

// Allow overriding local IP via Expo public env var
const DEFAULT_LOCAL_IP = '192.168.0.6';
const EMULATOR_IP = '10.0.2.2';

// Automatically detect if running on Android Emulator
const isAndroidEmulator = Platform.OS === 'android' && !Device.isDevice;

export const LOCAL_IP = process.env.EXPO_PUBLIC_LOCAL_IP || (isAndroidEmulator ? EMULATOR_IP : DEFAULT_LOCAL_IP);

export const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:3000/api' 
  : `http://${LOCAL_IP}:3000/api`;

export const PAYMENT_API_URL = Platform.OS === 'web' 
  ? 'http://localhost:3001' 
  : `http://${LOCAL_IP}:3001`;

export const SOCKET_URL = Platform.OS === 'web'
  ? 'http://localhost:3002'
  : `http://${LOCAL_IP}:3002`;
