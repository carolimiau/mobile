import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import authService from '../services/authService';
import locationService, { Region, Comuna } from '../services/locationService';

export const useRegister = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [primerNombre, setPrimerNombre] = useState('');
  const [segundoNombre, setSegundoNombre] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [rut, setRut] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [region, setRegion] = useState('');
  const [comuna, setComuna] = useState('');
  const [phone, setPhone] = useState('+56 9 ');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rutValid, setRutValid] = useState<boolean | null>(null);
  
  // Validation States
  const [emailError, setEmailError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const [showPasswordErrors, setShowPasswordErrors] = useState(false);

  const [regiones, setRegiones] = useState<Region[]>([]);
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [comunasFiltradas, setComunasFiltradas] = useState<Comuna[]>([]);
  const [loadingRegiones, setLoadingRegiones] = useState(false);
  const [loadingComunas, setLoadingComunas] = useState(false);

  const router = useRouter();

  useEffect(() => {
    loadRegiones();
    loadComunas();
  }, []);

  useEffect(() => {
    if (region && comunas.length > 0) {
      const regionObj = regiones.find(r => r.name === region);
      if (regionObj) {
        const filtered = comunas.filter(c => c.regionCode === regionObj.number);
        const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));
        setComunasFiltradas(sorted);
      }
    } else {
      setComunasFiltradas([]);
    }
    if (region) {
      setComuna('');
    }
  }, [region, comunas, regiones]);

  // Email Validation
  useEffect(() => {
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError('Correo electrónico inválido');
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }
  }, [email]);

  // Password Validation
  useEffect(() => {
    if (password) {
      setPasswordErrors({
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      });
      setShowPasswordErrors(true);
    } else {
      setShowPasswordErrors(false);
    }
  }, [password]);

  const loadRegiones = async () => {
    setLoadingRegiones(true);
    try {
      const data = await locationService.getRegiones();
      setRegiones(data);
    } catch (error) {
      console.error('Error al cargar regiones:', error);
    } finally {
      setLoadingRegiones(false);
    }
  };

  const loadComunas = async () => {
    setLoadingComunas(true);
    try {
      const data = await locationService.getComunas();
      setComunas(data);
    } catch (error) {
      console.error('Error al cargar comunas:', error);
    } finally {
      setLoadingComunas(false);
    }
  };

  const validateRut = (rut: string) => {
    // Implementar validación de RUT chileno
    if (!rut) return false;
    // Lógica simplificada para el ejemplo
    return rut.length > 8;
  };

  const handleRutChange = (text: string) => {
    // Formatear RUT
    setRut(text);
    setRutValid(validateRut(text));
  };

  const nextStep = async () => {
    if (currentStep === 1) {
      if (!primerNombre || !primerApellido || !rut || !birthDate || !rutValid) {
        Alert.alert('Error', 'Por favor completa todos los campos correctamente');
        return;
      }

      // Validar existencia de RUT en backend
      setLoading(true);
      try {
        const exists = await authService.validateRut(rut);
        if (!exists) {
            Alert.alert('Error', 'El RUT ingresado no es válido o no existe en los registros públicos.');
            setLoading(false);
            return;
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }

      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!region || !comuna || !phone) {
        Alert.alert('Error', 'Por favor completa todos los campos');
        return;
      }
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const register = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (emailError) {
      Alert.alert('Error', 'Por favor corrige el correo electrónico');
      return;
    }

    const isPasswordValid = Object.values(passwordErrors).every(Boolean);
    if (!isPasswordValid) {
      Alert.alert('Error', 'La contraseña no cumple con los requisitos de seguridad');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        primerNombre,
        segundoNombre: segundoNombre || undefined,
        primerApellido,
        segundoApellido: segundoApellido || undefined,
        rut,
        // fechaNacimiento: birthDate, // Backend might not support this in register DTO yet
        // region, // Not in DB
        // comuna, // Not in DB
        telefono: phone,
        email,
        password
      };

      await authService.register(userData);
      
      // Redirigir a la pantalla de configuración de avatar
      router.replace('/setup-avatar');
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return {
    currentStep,
    primerNombre, setPrimerNombre,
    segundoNombre, setSegundoNombre,
    primerApellido, setPrimerApellido,
    segundoApellido, setSegundoApellido,
    rut, handleRutChange, rutValid,
    birthDate, setBirthDate,
    region, setRegion,
    comuna, setComuna,
    phone, setPhone,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    loading,
    regiones,
    comunasFiltradas,
    nextStep,
    prevStep,
    register,
    emailError,
    passwordErrors,
    showPasswordErrors,
  };
};
