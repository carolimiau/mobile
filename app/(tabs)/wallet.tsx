import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { useWallet } from '../../hooks/useWallet';
import walletService from '../../services/walletService';
import { WebView } from 'react-native-webview';
import { router } from 'expo-router';

export default function WalletScreen() {
  const { balance, transactions, loading, refresh, addFunds } = useWallet();
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [webviewVisible, setWebviewVisible] = useState(false);
  const [webviewUrl, setWebviewUrl] = useState<string | null>(null);
  const [depositStatus, setDepositStatus] = useState<'idle' | 'success' | 'failure'>('idle');

  const handleDeposit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido');
      return;
    }

    setProcessing(true);
    try {
      const res = await addFunds(Number(amount));
      const url = res?.url || res?.redirectUrl || null;
      if (!url) throw new Error('No se recibió URL de pago');

      setModalVisible(false);
      setWebviewUrl(url);
      setWebviewVisible(true);
    } catch (error: any) {
      console.error('Error en depósito:', error);
      Alert.alert('Error', error?.message || 'Ocurrió un error al procesar la solicitud');
    } finally {
      setProcessing(false);
      setAmount('');
    }
  };

  const handleWebviewNavigation = async (navState: any) => {
    const url: string = navState?.url || '';
    if (!url) return;

    try {
      let token: string | null = null;
      if (url.includes('token_ws=')) {
        const parts = url.split('token_ws=');
        token = parts[1]?.split('&')[0];
      } else if (url.startsWith('autobox://')) {
        const m = url.match(/token_ws=([^&]+)/);
        if (m) token = decodeURIComponent(m[1]);
      }

      if (token) {
        try {
          const res = await walletService.confirmTransbankDeposit(token);
          setWebviewVisible(false);
          setWebviewUrl(null);

          const isAuthorized = res?.success === true
            || res?.data?.status === 'AUTHORIZED'
            || res?.transaction?.status === 'AUTHORIZED'
            || res?.transaction?.response_code === 0
            || res?.status === 'AUTHORIZED';

          if (isAuthorized) {
            setDepositStatus('success');
            // refresh will be called when user accepts the success screen
          } else {
            setDepositStatus('failure');
            Alert.alert('Error', 'No se pudo confirmar el depósito.');
          }
        } catch (e) {
          console.error('Error confirmando depósito:', e);
          setWebviewVisible(false);
          setDepositStatus('failure');
          Alert.alert('Error', 'No se pudo confirmar el depósito.');
        }
      } else if (url.includes('cancel') || url.includes('anulado')) {
        setWebviewVisible(false);
        Alert.alert('Pago Anulado', 'La carga fue cancelada.');
      }
    } catch (e) {
      console.warn('Error parsing WebView URL:', e);
    }
  };

  if (depositStatus === 'success') {
    return (
      <Screen backgroundColor="#FFF">
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={96} color="#4CAF50" />
          <Text style={styles.successTitle}>¡Carga Exitosa!</Text>
          <Text style={styles.successMessage}>Tu saldo ha sido actualizado correctamente.</Text>
          <TouchableOpacity
            style={styles.successButton}
            onPress={() => { setDepositStatus('idle'); refresh(); }}
          >
            <Text style={styles.successButtonText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const renderTransaction = ({ item }: { item: any }) => {
    const isCredit = item.monto > 0;
    const amount = Math.abs(item.monto);

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionIcon}>
          <Ionicons
            name={isCredit ? 'arrow-down' : 'arrow-up'}
            size={24}
            color={isCredit ? '#4CAF50' : '#F44336'}
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription}>{item.descripcion || item.description}</Text>
          <Text style={styles.transactionDate}>{new Date(item.fechaCreacion || item.createdAt).toLocaleDateString()}</Text>
        </View>
        <Text style={[styles.transactionAmount, { color: isCredit ? '#4CAF50' : '#F44336' }]}> 
          {isCredit ? '+' : '-'}${amount.toLocaleString('es-CL')}
        </Text>
      </View>
    );
  };

  return (
    <Screen backgroundColor="#F5F5F5">
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Billetera</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Saldo Disponible</Text>
        <Text style={styles.balanceValue}>${balance.toLocaleString('es-CL')}</Text>

        <TouchableOpacity style={styles.depositButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={24} color="#4CAF50" />
          <Text style={styles.depositButtonText}>Cargar Saldo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionsContainer}>
        <Text style={styles.sectionTitle}>Movimientos Recientes</Text>
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTransaction}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#4CAF50" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay movimientos recientes</Text>
            </View>
          }
        />
      </View>

      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cargar Saldo</Text>
            <Text style={styles.modalSubtitle}>Ingresa el monto a cargar</Text>

            <TextInput
              style={styles.input}
              placeholder="Ej: 10000"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setModalVisible(false); setAmount(''); }} disabled={processing}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleDeposit} disabled={processing}>
                {processing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmButtonText}>Confirmar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {webviewVisible && (
        <Modal animationType="slide" visible={webviewVisible} onRequestClose={() => { setWebviewVisible(false); setWebviewUrl(null); }}>
          <SafeAreaView style={{ flex: 1 }}>
            {webviewUrl ? (
              <WebView source={{ uri: webviewUrl }} onNavigationStateChange={handleWebviewNavigation} startInLoadingState style={{ flex: 1 }} />
            ) : (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" />
              </View>
            )}
          </SafeAreaView>
        </Modal>
      )}
    </Screen>
  );
}

if (typeof undefined !== 'undefined') {}

// Render success view for deposit
// (Placed after component to avoid reordering states in the component)
export function WalletDepositSuccess({ onDone }: { onDone?: () => void }) {
  return null;
}


const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: { padding: 8 },
  placeholder: { width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', flex: 1, textAlign: 'center' },
  balanceContainer: { backgroundColor: '#4CAF50', padding: 24, alignItems: 'center', justifyContent: 'center' },
  balanceLabel: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 16, marginBottom: 8 },
  balanceValue: { color: '#FFF', fontSize: 36, fontWeight: 'bold' },
  transactionsContainer: { flex: 1, backgroundColor: '#FFF', marginTop: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  transactionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  transactionDetails: { flex: 1 },
  transactionDescription: { fontSize: 16, color: '#333', fontWeight: '500' },
  transactionDate: { fontSize: 12, color: '#999' },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
  emptyContainer: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 14 },
  depositButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 16 },
  depositButtonText: { color: '#4CAF50', fontWeight: 'bold', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  input: { width: '100%', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 24 },
  modalButtons: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#F5F5F5', marginRight: 8 },
  confirmButton: { backgroundColor: '#4CAF50', marginLeft: 8 },
  cancelButtonText: { color: '#666', fontWeight: 'bold' },
  confirmButtonText: { color: '#FFF', fontWeight: 'bold' },
  webviewLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#FFF' },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#333', marginTop: 16 },
  successMessage: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center' },
  successButton: { marginTop: 24, backgroundColor: '#4CAF50', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 8 },
  successButtonText: { color: '#FFF', fontWeight: '700' },
});

