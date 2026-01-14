import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import authService from '../services/authService';
import uploadService from '../services/uploadService';
import { User } from '../types';

export function useProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    primerNombre: '',
    primerApellido: '',
    email: '',
    telefono: '',
    rut: '',
    foto_url: '',
    password: '',
    confirmPassword: '',
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Password Validation
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const [showPasswordErrors, setShowPasswordErrors] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  // Email Validation
  useEffect(() => {
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setEmailError('Correo electrónico inválido');
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }
  }, [formData.email]);

  // Password Validation Effect
  useEffect(() => {
    if (formData.password) {
      setPasswordErrors({
        length: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        lowercase: /[a-z]/.test(formData.password),
        number: /\d/.test(formData.password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
      });
      setShowPasswordErrors(true);
    } else {
      setShowPasswordErrors(false);
    }
  }, [formData.password]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userData = await authService.getUser();
      if (userData) {
        setUser(userData);
        setFormData({
          primerNombre: userData.primerNombre || '',
          primerApellido: userData.primerApellido || '',
          email: userData.email || '',
          telefono: userData.telefono ? userData.telefono.toString() : '',
          rut: userData.rut || '',
          foto_url: userData.foto_url || '',
          password: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!user?.id) {
        throw new Error('No se encontró el usuario autenticado');
      }

      // Validar contraseñas si se ingresaron
      if (formData.password || formData.confirmPassword) {
        if (formData.password !== formData.confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            setSaving(false);
            return;
        }

        const isPasswordValid = Object.values(passwordErrors).every(Boolean);
        if (!isPasswordValid) {
            Alert.alert('Error', 'La contraseña no cumple con los requisitos de seguridad');
            setSaving(false);
            return;
        }
      }

      if (emailError) {
        Alert.alert('Error', 'Por favor corrige el email antes de guardar');
        setSaving(false);
        return;
      }

      const payload: any = {
        primerNombre: formData.primerNombre,
        primerApellido: formData.primerApellido,
        telefono: formData.telefono,
        email: formData.email,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const updatedUser = await authService.updateProfileData(user.id, payload);
      setUser(updatedUser);
      setFormData(prev => ({
        ...prev,
        primerNombre: updatedUser.primerNombre || '',
        primerApellido: updatedUser.primerApellido || '',
        telefono: updatedUser.telefono ? updatedUser.telefono.toString() : '',
        email: updatedUser.email || prev.email,
        rut: updatedUser.rut || prev.rut,
        foto_url: updatedUser.foto_url || prev.foto_url,
        password: '',
        confirmPassword: '',
      }));
      setIsEditing(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (useCamera = false) => {
    try {
      if (!user?.id) return;
      setUploadingAvatar(true);

      const image = await uploadService.pickImage(useCamera);
      if (!image) return;

      const publicUrl = await uploadService.uploadAvatar(image.uri, user.id);
      const updatedUser = await authService.updateProfileData(user.id, { foto_url: publicUrl });
      setUser(updatedUser);
      setFormData(prev => ({ ...prev, foto_url: publicUrl }));
      Alert.alert('Éxito', 'Foto de perfil actualizada');
    } catch (error) {
      console.error('Error al actualizar avatar:', error);
      Alert.alert('Error', 'No se pudo actualizar la foto de perfil');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return {
    user,
    loading,
    saving,
    isEditing,
    setIsEditing,
    formData,
    updateFormData,
    handleSave,
    handleAvatarChange,
    uploadingAvatar,
    passwordErrors,
    showPasswordErrors,
    emailError,
  };
}
