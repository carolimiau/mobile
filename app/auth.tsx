import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/ui/Screen';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useLogin } from '../hooks/useLogin';

export default function AuthScreen() {
  const router = useRouter();
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    login,
    quickLogin,
    socialLogin
  } = useLogin();
  
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Screen backgroundColor="#FFFFFF">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Image
                source={require('../assets/images/logo.jpeg')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Bienvenido a AutoBox</Text>
              <Text style={styles.subtitle}>Tu plataforma de confianza para comprar y vender autos</Text>
            </View>

            <View style={styles.form}>
              <Input
                label="Correo Electrónico"
                placeholder="ejemplo@correo.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Ionicons name="mail-outline" size={20} color="#666" />}
              />

              <Input
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#666" />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                  </TouchableOpacity>
                }
              />

              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={() => router.push('/forgot-password')}
              >
                <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>

              <Button
                title="Iniciar Sesión"
                onPress={login}
                loading={loading}
                style={styles.loginButton}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>O continúa con</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtons}>
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => socialLogin('google')}
                >
                  <Ionicons name="logo-google" size={24} color="#DB4437" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => socialLogin('apple')}
                >
                  <Ionicons name="logo-apple" size={24} color="#000000" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => socialLogin('facebook')}
                >
                  <Ionicons name="logo-facebook" size={24} color="#4267B2" />
                </TouchableOpacity>
              </View>

              {/* Botones de acceso rápido para desarrollo */}
              {__DEV__ && (
                <View style={styles.devButtons}>
                  <Text style={styles.devTitle}>Accesos Rápidos (Dev)</Text>
                  <View style={styles.devButtonsRow}>
                    <Button 
                      title="Admin" 
                      size="small" 
                      variant="outline" 
                      onPress={() => quickLogin('ma.bellor@duocuc.cl', 'Pelota50%')}
                      style={styles.devButton}
                    />
                    <Button 
                      title="Mecánico" 
                      size="small" 
                      variant="outline" 
                      onPress={() => quickLogin('matias@gmail.com', 'Pelota50%')}
                      style={styles.devButton}
                    />
                    <Button 
                      title="Usuario" 
                      size="small" 
                      variant="outline" 
                      onPress={() => quickLogin('mati@gmail.com', 'Pelota50%')}
                      style={styles.devButton}
                    />
                  </View>
                </View>
              )}

              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>¿No tienes una cuenta? </Text>
                <TouchableOpacity onPress={() => router.push('/register')}>
                  <Text style={styles.registerLink}>Regístrate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 32,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    color: '#666',
  },
  registerLink: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  devButtons: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  devTitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
  },
  devButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  devButton: {
    flex: 1,
  },
});
