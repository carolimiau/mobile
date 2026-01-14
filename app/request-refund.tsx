import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/ui/Screen';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import refundsService, { BankAccount } from '../services/refundsService';

export default function RequestRefundScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const publicationId = params.publicationId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'bank-info' | 'reason' | 'success'>('bank-info');
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  
  // Bank Form State
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountType: '',
    accountNumber: '',
    rut: '',
    fullName: '',
    email: '',
  });

  // Reason State
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadBankAccount();
  }, []);

  const loadBankAccount = async () => {
    try {
      const account = await refundsService.getMyBankAccount();
      if (account) {
        setBankAccount(account);
        setBankForm({
          bankName: account.bankName,
          accountType: account.accountType,
          accountNumber: account.accountNumber,
          rut: account.rut,
          fullName: account.fullName,
          email: account.email,
        });
        // If account exists, we can go straight to reason, but maybe show it for confirmation first?
        // Let's stay in bank-info but pre-filled/readonly or editable.
        // For simplicity, if exists, we just let them edit or proceed.
      }
    } catch (error) {
      console.log('No bank account found or error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBankAccount = async () => {
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.rut || !bankForm.fullName) {
      Alert.alert('Error', 'Por favor complete todos los campos obligatorios');
      return;
    }

    try {
      setSubmitting(true);
      const savedAccount = await refundsService.saveBankAccount(bankForm);
      setBankAccount(savedAccount);
      setStep('reason');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar la cuenta bancaria');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitRefund = async () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Por favor ingrese el motivo del reembolso');
      return;
    }

    try {
      setSubmitting(true);
      await refundsService.requestRefund(publicationId, reason);
      setStep('success');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo solicitar el reembolso');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Screen backgroundColor="#F5F5F5">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </Screen>
    );
  }

  if (step === 'success') {
    return (
      <Screen backgroundColor="#F5F5F5">
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          <Text style={styles.successTitle}>¡Solicitud Enviada!</Text>
          <Text style={styles.successText}>
            Hemos recibido tu solicitud de reembolso. Revisaremos los antecedentes y 
            realizaremos la transferencia a tu cuenta bancaria en caso de ser aprobada.
          </Text>
          <Button 
            title="Volver al Inicio" 
            onPress={() => router.replace('/(tabs)')}
            style={styles.successButton}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#F5F5F5">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            {!submitting && (
              <Button 
                title="Volver" 
                variant="ghost" 
                onPress={() => {
                  if (step === 'reason') setStep('bank-info');
                  else router.back();
                }}
                style={{ alignSelf: 'flex-start', marginBottom: 10 }}
              />
            )}
            <Text style={styles.title}>Solicitar Reembolso</Text>
            <Text style={styles.subtitle}>
              {step === 'bank-info' 
                ? 'Datos Bancarios para Transferencia' 
                : 'Detalle de la Solicitud'}
            </Text>
          </View>

          {step === 'bank-info' ? (
            <View style={styles.formContainer}>
              <Text style={styles.sectionRequired}>Todos los campos son obligatorios para realizar la devolución.</Text>
              
              <Input
                label="Banco"
                placeholder="Ej: Banco Estado, Santander..."
                value={bankForm.bankName}
                onChangeText={(text) => setBankForm({...bankForm, bankName: text})}
              />
              <Input
                label="Tipo de Cuenta"
                placeholder="Ej: Cuenta Rut, Corriente..."
                value={bankForm.accountType}
                onChangeText={(text) => setBankForm({...bankForm, accountType: text})}
              />
              <Input
                label="Número de Cuenta"
                placeholder="123456789"
                keyboardType="numeric"
                value={bankForm.accountNumber}
                onChangeText={(text) => setBankForm({...bankForm, accountNumber: text})}
              />
              <Input
                label="RUT Titular"
                placeholder="12.345.678-9"
                value={bankForm.rut}
                onChangeText={(text) => setBankForm({...bankForm, rut: text})}
              />
              <Input
                label="Nombre Completo Titular"
                placeholder="Juan Pérez"
                value={bankForm.fullName}
                onChangeText={(text) => setBankForm({...bankForm, fullName: text})}
              />
              <Input
                label="Correo Electrónico"
                placeholder="juan@ejemplo.com"
                keyboardType="email-address"
                value={bankForm.email}
                onChangeText={(text) => setBankForm({...bankForm, email: text})}
              />

              <Button
                title={submitting ? "Guardando..." : "Continuar"}
                onPress={handleSaveBankAccount}
                disabled={submitting}
                style={{ marginTop: 20 }}
              />
            </View>
          ) : (
            <View style={styles.formContainer}>
               <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Cuenta de destino:</Text>
                <Text style={styles.infoValue}>{bankForm.bankName} - {bankForm.accountType}</Text>
                <Text style={styles.infoValue}>{bankForm.accountNumber}</Text>
              </View>

              <Text style={styles.label}>Motivo de la solicitud</Text>
              <Input
                placeholder="Explícanos por qué solicitas el reembolso..."
                multiline
                numberOfLines={4}
                value={reason}
                onChangeText={setReason}
                style={{ height: 120, textAlignVertical: 'top' }}
              />
              
              <Text style={styles.disclaimer}>
                Al enviar esta solicitud, confirmas que los datos bancarios ingresados son correctos.
                Autobox no se hace responsable por transferencias a cuentas erróneas.
              </Text>

              <Button
                title={submitting ? "Enviando..." : "Confirmar Solicitud"}
                onPress={handleSubmitRefund}
                disabled={submitting}
                style={{ marginTop: 20 }}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionRequired: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
  },
  disclaimer: {
    fontSize: 12,
    color: '#757575',
    marginTop: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  successText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  successButton: {
    width: '100%',
  },
});
