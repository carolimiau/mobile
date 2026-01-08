import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_URL } from '../constants/Config';
import { User } from '../types';

interface RegisterData {
  primerNombre: string;
  primerApellido: string;
  rut: string;
  email: string;
  password: string;
  telefono?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  user: User;
}

class AuthService {
  private tokenKey = '@autobox_token';
  private userKey = '@autobox_user';

  async validateRut(rut: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/users/validate-rut/${rut}`);
      if (!response.ok) return false;
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error('Error validando RUT:', error);
      return true; // Permitir si hay error de red para no bloquear
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      console.log('📦 [AUTH] Respuesta del registro:', {
        status: response.status,
        hasAccessToken: !!result.access_token,
        hasUser: !!result.usuario,
        keys: Object.keys(result)
      });

      if (!response.ok) {
        // Manejar errores del backend (validaciones)
        const errorMessage = Array.isArray(result.message)
          ? result.message.join('\n')
          : result.message || 'Error al crear la cuenta';
        throw new Error(errorMessage);
      }

      // El backend devuelve access_token, no accessToken
      const token = result.access_token;
      if (!token) {
        throw new Error('No se recibió token de autenticación');
      }

      if (!result.usuario) {
        throw new Error('No se recibió información del usuario');
      }

      // Guardar token y usuario en AsyncStorage
      await this.saveAuth(token, result.usuario);

      return {
        accessToken: token, // Normalizar el nombre para el resto de la app
        user: result.usuario
      };
    } catch (error: any) {
      console.error('Error en register:', error);
      throw error;
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      // Add timeout to login request
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('El servidor no responde. Verifica tu conexión o que el backend esté corriendo.')), 10000);
      });

      const fetchPromise = fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const response = await Promise.race([fetchPromise, timeout]) as Response;

      const result = await response.json();

      console.log('📦 [AUTH] Respuesta del login:', {
        status: response.status,
        hasAccessToken: !!result.access_token,
        hasUser: !!result.usuario,
        userRole: result.usuario?.rol,
        fullUser: result.usuario
      });

      if (!response.ok) {
        throw new Error(result.message || 'Error al iniciar sesión');
      }

      // El backend devuelve access_token, no accessToken
      const token = result.access_token;
      if (!token) {
        throw new Error('No se recibió token de autenticación');
      }

      if (!result.usuario) {
        throw new Error('No se recibió información del usuario');
      }

      await this.saveAuth(token, result.usuario);

      return {
        accessToken: token, // Normalizar el nombre para el resto de la app
        user: result.usuario
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async socialLogin(data: { email: string; provider: string; providerId: string; firstName?: string; lastName?: string; avatarUrl?: string }): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/social-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error en inicio de sesión social');
      }

      const token = result.access_token;
      if (!token) {
        throw new Error('No se recibió token de autenticación');
      }

      if (!result.usuario) {
        throw new Error('No se recibió información del usuario');
      }

      await this.saveAuth(token, result.usuario);

      return {
        accessToken: token,
        user: result.usuario
      };
    } catch (error) {
      console.error('Social Login error:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al solicitar recuperación de contraseña');
      }
    } catch (error) {
      console.error('Forgot Password error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.tokenKey, this.userKey]);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.tokenKey);
    } catch (error) {
      console.error('Error al obtener token:', error);
      return null;
    }
  }

  async getUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(this.userKey);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  async saveAuth(token: string, user: User): Promise<void> {
    try {
      if (!token) {
        throw new Error('Token is required for saveAuth');
      }
      if (!user) {
        throw new Error('User is required for saveAuth');
      }

      await AsyncStorage.multiSet([
        [this.tokenKey, token],
        [this.userKey, JSON.stringify(user)],
      ]);
    } catch (error) {
      console.error('Error al guardar autenticación:', error);
      throw error;
    }
  }

  async updateUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(this.userKey, JSON.stringify(user));
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  }

  async updatePushToken(token: string): Promise<void> {
    try {
      const user = await this.getUser();
      const authToken = await this.getToken();
      
      if (!user || !authToken) return;

      await fetch(`${API_URL}/users/${user.id}/push-token`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token }),
      });
    } catch (error) {
      console.error('Error updating push token:', error);
    }
  }

  async updateProfileData(userId: string, data: Partial<User>): Promise<User> {
    const token = await this.getToken();
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar perfil');
    }

    const updatedUser = await response.json();
    await this.updateUser(updatedUser);
    return updatedUser;
  }

  async refreshProfile(): Promise<User | null> {
    try {
      const token = await this.getToken();
      if (!token) return null;

      // Create a timeout promise
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 5000);
      });

      const fetchPromise = fetch(`${API_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const response = await Promise.race([fetchPromise, timeout]) as Response;

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const user = await response.json();
      await this.updateUser(user);
      return user;
    } catch (error) {
      console.error('Error refreshing profile:', error);
      return null;
    }
  }
}

export default new AuthService();
