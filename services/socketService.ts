import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import authService from './authService';
import { SOCKET_URL } from '../constants/Config';
import pushNotificationService from './pushNotificationService';

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private listeners: Map<string, Set<Function>> = new Map();

  /**
   * Conectar al servidor WebSocket
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      console.log('✅ Socket ya está conectado');
      return;
    }

    try {
      const token = await authService.getToken();
      
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 8000,
        timeout: 25000,
        forceNew: true,
        autoConnect: true,
        upgrade: false,
        path: '/socket.io',
      });

      console.log(`🔌 Intentando conectar a: ${SOCKET_URL}`);

      this.setupEventListeners();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout de conexión'));
        }, 25000);

        this.socket!.on('connect', () => {
          clearTimeout(timeout);
          this.isConnected = true;
          console.log('✅ WebSocket conectado:', this.socket!.id);
          resolve();
        });

        this.socket!.on('connect_error', (error) => {
          clearTimeout(timeout);
          console.error('❌ Error de conexión WebSocket:', error?.message || error);
          // For timeouts, let reconnection logic continue
          if (String(error?.message || '').toLowerCase().includes('timeout')) {
            // Do not hard fail; allow reconnection attempts
            return;
          }
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error al conectar WebSocket:', error);
      throw error;
    }
  }

  /**
   * Configurar listeners de eventos del socket
   */
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('✅ WebSocket conectado:', this.socket!.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('❌ WebSocket desconectado. Razón:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión:', error.message);
    });

    // Manejar errores de autenticación
    this.socket.on('auth_error', async (data: { code: string; message: string; attemptsRemaining?: number }) => {
      console.error('🔐 Error de autenticación WebSocket:', data);
      
      // Si el código indica que se excedieron los intentos o el token es inválido de forma permanente
      if (data.code === 'MAX_ATTEMPTS_EXCEEDED' || data.code === 'INVALID_TOKEN' || data.code === 'NO_TOKEN') {
        console.error('❌ Error crítico de autenticación - cerrando sesión');
        const authService = (await import('./authService')).default;
        const { router } = await import('expo-router');
        await authService.logout();
        this.disconnect();
        router.replace('/auth');
        return;
      }
      
      if (data.code === 'TOKEN_EXPIRED') {
        console.log('⏰ Token expirado, intentando renovar...');
        // Solo intentar renovar si quedan intentos
        if (!data.attemptsRemaining || data.attemptsRemaining > 0) {
          await this.refreshAuthToken();
        } else {
          console.error('❌ No quedan intentos de renovación - cerrando sesión');
          const authService = (await import('./authService')).default;
          const { router } = await import('expo-router');
          await authService.logout();
          this.disconnect();
          router.replace('/auth');
        }
      }
    });

    // Confirmación de autenticación exitosa
    this.socket.on('authenticated', (data: { userId: string }) => {
      console.log('✅ Autenticación exitosa para usuario:', data.userId);
    });

    this.socket.on('reconnect', async (attemptNumber) => {
      this.isConnected = true;
      console.log(`🔄 WebSocket reconectado después de ${attemptNumber} intentos`);
      
      // Renovar token después de reconexión
      await this.refreshAuthToken();
    });

    this.socket.on('reconnect_attempt', async (attemptNumber) => {
      console.log(`🔄 Intento de reconexión #${attemptNumber}`);
      
      // Intentar obtener un nuevo token antes de reconectar
      try {
        const newToken = await authService.getToken();
        if (newToken && this.socket) {
          // Actualizar token de autenticación
          this.socket.auth = { token: newToken };
        }
      } catch (error) {
        console.warn('⚠️ No se pudo obtener nuevo token para reconexión');
      }
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Error de reconexión:', error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconexión fallida después de todos los intentos');
      this.emit('reconnect_failed', {});
    });

    // Escuchar nuevos mensajes
    this.socket.on('new_message', (data) => {
      this.emit('new_message', data);
      
      // Mostrar notificación local si la app está abierta
      if (data?.message) {
        const actionUrl = `/(tabs)/chat-detail?userId=${data.senderId || data.userId}&userName=${encodeURIComponent(data.senderName || '')}`;
        
        pushNotificationService.sendLocalNotification(
          data.senderName || 'Nuevo Mensaje',
          data.message,
          { type: 'message', actionUrl, ...data }
        );
      }
    });

    // Mensaje enviado confirmación
    this.socket.on('message_sent', (data) => {
      this.emit('message_sent', data);
    });

    // Usuario escribiendo
    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data);
    });

    // Mensajes leídos
    this.socket.on('messages_read', (data) => {
      this.emit('messages_read', data);
    });

    // Estado de usuario
    this.socket.on('user_status', (data) => {
      this.emit('user_status', data);
    });

    // Conversación cargada
    this.socket.on('conversation_loaded', (data) => {
      console.log('📥 conversation_loaded recibido:', {
        otherUserId: data.otherUserId,
        messagesCount: data.messages?.length || 0,
        totalCount: data.count
      });
      this.emit('conversation_loaded', data);
    });

    // Conversaciones cargadas
    this.socket.on('conversations_loaded', (data) => {
      this.emit('conversations_loaded', data);
    });

    // Error al enviar mensaje
    this.socket.on('message_error', (data) => {
      this.emit('message_error', data);
    });

    // Error al cargar
    this.socket.on('load_error', (data) => {
      this.emit('load_error', data);
    });

    // Nueva solicitud de inspección
    this.socket.on('inspection_assigned', (data) => {
      console.log('🔔 Nueva inspección asignada:', data);
      this.emit('inspection_assigned', data);
      
      const actionUrl = `/(mechanic)/inspection-detail?id=${data.id || data.inspectionId}`;

      pushNotificationService.sendLocalNotification(
        'Nueva Inspección',
        'Se te ha asignado una nueva inspección',
        { type: 'inspection', actionUrl, ...data }
      );
    });

    // Notificación genérica (Admin/System)
    this.socket.on('notification', (data) => {
      console.log('🔔 Nueva notificación recibida:', data);
      this.emit('notification', data);
      
      pushNotificationService.sendLocalNotification(
        data.title || 'Nueva Notificación',
        data.message || data.body || '',
        { type: 'notification', ...data }
      );
    });

    // Confirmación de autenticación exitosa
    this.socket.on('authenticated', (data: { userId: string }) => {
      console.log('✅ Autenticación exitosa para usuario:', data.userId);
    });
  }

  /**
   * Renovar token de autenticación sin desconectar
   */
  private async refreshAuthToken(): Promise<void> {
    try {
      const newToken = await authService.getToken();
      
      if (!newToken) {
        console.error('❌ No se pudo obtener nuevo token');
        this.emit('auth_required', { code: 'NO_TOKEN' });
        return;
      }

      if (!this.socket?.connected) {
        console.log('⚠️ Socket no conectado, no se puede renovar token');
        return;
      }

      console.log('🔄 Enviando nuevo token al servidor...');
      
      // Emitir evento para actualizar autenticación
      this.socket.emit('refresh_auth', { token: newToken });
      
      // También actualizar el auth del socket para futuras reconexiones
      this.socket.auth = { token: newToken };
      
      console.log('✅ Token renovado exitosamente');
    } catch (error) {
      console.error('❌ Error renovando token:', error);
      this.emit('auth_required', { code: 'TOKEN_REFRESH_FAILED' });
    }
  }

  /**
   * Renovar token manualmente (método público)
   */
  async refreshToken(): Promise<void> {
    return this.refreshAuthToken();
  }

  /**
   * Desconectar del servidor
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
      console.log('👋 WebSocket desconectado manualmente');
    }
  }

  /**
   * Enviar mensaje
   */
  async sendMessage(receiverId: string | string[], message: string, tempId?: string, vehicleId?: string): Promise<void> {
    // Asegurar que estamos conectados
    if (!this.socket?.connected) {
      console.log('⚠️ Socket no conectado, intentando conectar...');
      await this.connect();
    }

    if (!this.socket?.connected) {
      throw new Error('No se pudo conectar al servidor de chat');
    }

    // Limpiar receiverId si viene como array
    const cleanReceiverId = Array.isArray(receiverId) ? receiverId[0] : receiverId;
    const cleanVehicleId = vehicleId && Array.isArray(vehicleId) ? vehicleId[0] : vehicleId;

    console.log('📤 Enviando mensaje:', {
      receiverId: cleanReceiverId,
      message: message.substring(0, 30),
      tempId,
      vehicleId: cleanVehicleId
    });

    this.socket.emit('send_message', {
      receiverId: cleanReceiverId,
      message,
      tempId,
      vehicleId: cleanVehicleId,
    });
  }

  /**
   * Notificar que el usuario está escribiendo
   */
  async sendTyping(receiverId: string, isTyping: boolean): Promise<void> {
    // Asegurar que estamos conectados
    if (!this.socket?.connected) {
      await this.connect().catch(() => {});
    }

    if (!this.socket?.connected) return;

    this.socket.emit('typing', {
      receiverId,
      isTyping,
    });
  }

  /**
   * Marcar mensajes como leídos
   */
  async markAsRead(senderId: string): Promise<void> {
    if (!this.socket?.connected) {
      await this.connect().catch(() => {});
    }

    if (!this.socket?.connected) return;

    console.log('📖 Enviando mark_read para senderId:', senderId);
    this.socket.emit('mark_read', { senderId });
  }

  /**
   * Cargar conversación con otro usuario
   */
  async loadConversation(userId: string | string[]): Promise<void> {
    if (!this.socket?.connected) {
      await this.connect().catch(() => {});
    }

    if (!this.socket?.connected) return;

    // Asegurar que userId sea un string
    const cleanUserId = Array.isArray(userId) ? userId[0] : userId;
    
    console.log('📥 loadConversation - userId:', cleanUserId);

    this.socket.emit('load_conversation', { otherUserId: cleanUserId });
  }

  /**
   * Cargar lista de conversaciones
   */
  async loadConversations(): Promise<void> {
    if (!this.socket?.connected) {
      await this.connect().catch(() => {});
    }

    if (!this.socket?.connected) return;

    this.socket.emit('load_conversations');
  }

  /**
   * Registrar listener para un evento
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remover listener de un evento
   */
  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  /**
   * Emitir evento a los listeners registrados
   */
  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  /**
   * Verificar si está conectado
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }
}

export default new SocketService();
