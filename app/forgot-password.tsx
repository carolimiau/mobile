import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/ui/Screen';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import authService from '../services/authService';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Validation
  const [emailError, setEmailError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const [showPasswordErrors, setShowPasswordErrors] = useState(false);

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

  const handleSendCode = async () => {
    if (!email) {
        setEmailError('Ingresa tu correo');
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        setEmailError('Correo inválido');
        return;
    }
    
    try {
        setLoading(true);
        setEmailError('');
        const res = await authService.forgotPassword(email);
        Alert.alert('Código enviado', 'Revisa tu correo electrónico para obtener el código de recuperación.');
        if (res.debug_token) {
           console.log('DEBUG TOKEN:', res.debug_token);
           // Alert.alert('DEBUG TOKEN', res.debug_token); // Optional: for testing on device
        }
        setStep(2);
    } catch (error: any) {
        Alert.alert('Error', error.message || 'No se pudo enviar el código');
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyToken = async () => {
      if (!token || token.length < 6) {
          Alert.alert('Error', 'Ingresa un código válido');
          return;
      }
      try {
          setLoading(true);
          await authService.verifyToken(email, token);
          setStep(3);
      } catch (error: any) {
          Alert.alert('Error', error.message || 'Código inválido');
      } finally {
          setLoading(false);
      }
  };

  const handleResetPassword = async () => {
      if (password !== confirmPassword) {
          Alert.alert('Error', 'Las contraseñas no coinciden');
          return;
      }
      
      const isPasswordValid = Object.values(passwordErrors).every(Boolean);
      if (!isPasswordValid) {
          Alert.alert('Error', 'La contraseña no cumple con los requisitos');
          return;
      }

      try {
          setLoading(true);
          await authService.resetPassword(email, token, password);
          Alert.alert('Éxito', 'Tu contraseña ha sido restablecida', [
              { text: 'Iniciar Sesión', onPress: () => router.replace('/auth') }
          ]);
      } catch (error: any) {
          Alert.alert('Error', error.message || 'No se pudo restablecer la contraseña');
      } finally {
          setLoading(false);
      }
  };

  const RequirementItem = ({ valid, text }: { valid: boolean; text: string }) => (
    <View style={styles.requirementItem}>
      <Ionicons 
        name={valid ? "checkmark-circle" : "close-circle"} 
        size={16} 
        color={valid ? "#4CAF50" : "#F44336"} 
      />
      <Text style={[styles.requirementText, { color: valid ? "#4CAF50" : "#F44336" }]}>
        {text}
      </Text>
    </View>
  );

  return (
    <Screen backgroundColor="#FFFFFF">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recuperar Contraseña</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {step === 1 && (
              <View>
                  <Text style={styles.description}>Ingresa tu correo electrónico asociado a tu cuenta para recibir un código de recuperación.</Text>
                  <Input
                    label="Correo Electrónico"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={emailError}
                  />
                  <Button
                    title="Enviar Código"
                    onPress={handleSendCode}
                    loading={loading}
                    style={styles.button}
                  />
              </View>
          )}

          {step === 2 && (
              <View>
                  <Text style={styles.description}>Hemos enviado un código a {email}. Ingrésalo a continuación:</Text>
                  <Input
                    label="Código de Verificación"
                    placeholder="123456"
                    value={token}
                    onChangeText={setToken}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={{ letterSpacing: 8, fontSize: 24, textAlign: 'center' }}
                  />
                  <Button
                    title="Verificar Código"
                    onPress={handleVerifyToken}
                    loading={loading}
                    style={styles.button}
                  />
                  <TouchableOpacity onPress={() => setStep(1)} style={styles.linkButton}>
                      <Text style={styles.linkText}>¿No recibiste el código? Intentar de nuevo</Text>
                  </TouchableOpacity>
              </View>
          )}

          {step === 3 && (
              <View>
                  <Text style={styles.description}>Crea una nueva contraseña para tu cuenta.</Text>
                  <Input
                    label="Nueva Contraseña"
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                  
                  {showPasswordErrors && (
                    <View style={styles.passwordRequirements}>
                      <Text style={styles.requirementsTitle}>La contraseña debe tener:</Text>
                      <RequirementItem valid={passwordErrors.length} text="Mínimo 8 caracteres" />
                      <RequirementItem valid={passwordErrors.uppercase} text="Una mayúscula" />
                      <RequirementItem valid={passwordErrors.lowercase} text="Una minúscula" />
                      <RequirementItem valid={passwordErrors.number} text="Un número" />
                      <RequirementItem valid={passwordErrors.special} text="Un caracter especial (!@#$%...)" />
                    </View>
                  )}

                  <Input
                    label="Confirmar Contraseña"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                  
                  <Button
                    title="Restablecer Contraseña"
                    onPress={handleResetPassword}
                    loading={loading}
                    style={styles.button}
                  />
              </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 24,
  },
  description: {
      fontSize: 16,
      color: '#666',
      marginBottom: 24,
      lineHeight: 24,
  },
  button: {
      marginTop: 24,
  },
  linkButton: {
      marginTop: 16,
      alignItems: 'center',
  },
  linkText: {
      color: '#007bff',
      fontSize: 14,
  },
  passwordRequirements: {
    marginTop: 8,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    marginLeft: 6,
  },
});
