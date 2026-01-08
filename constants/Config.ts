import { Platform } from 'react-native';

// Allow overriding local IP via Expo public env var
export const LOCAL_IP = process.env.EXPO_PUBLIC_LOCAL_IP || '192.168.0.18';

export const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:3000/api' 
  : `http://${LOCAL_IP}:3000/api`;

export const PAYMENT_API_URL = Platform.OS === 'web' 
  ? 'http://localhost:3001' 
  : `http://${LOCAL_IP}:3001`;

export const SOCKET_URL = Platform.OS === 'web'
  ? 'http://localhost:3002'
  : `http://${LOCAL_IP}:3002`;
