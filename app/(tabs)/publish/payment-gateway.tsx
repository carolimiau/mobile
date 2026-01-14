import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Linking, AppState, Platform, TouchableOpacity, Modal, SafeAreaView, useWindowDimensions, StatusBar, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '../../../components/ui/Screen';
import { Button } from '../../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import apiService from '../../../services/apiService';
import authService from '../../../services/authService';
import { useWallet } from '../../../hooks/useWallet';
import { API_URL, LOCAL_IP } from '../../../constants/Config';

export default function PaymentGatewayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { balance, refresh: refreshWallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failure' | 'cancelled'>('pending');
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'webpay' | 'wallet'>('webpay');
  const [prices, setPrices] = useState<{ nombre: string; precio: number }[]>([]);
  const [webviewVisible, setWebviewVisible] = useState(false);
  const [webviewUrl, setWebviewUrl] = useState<string | null>(null);

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const { amount, description, serviceType, metadata } = params;

  useEffect(() => {
    loadPrices();
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isWaitingForPayment]);

  const loadPrices = async () => {
    try {
      const data = await apiService.getPrices();
      setPrices(data);
    } catch (error) {
      console.error('Error loading prices:', error);
    }
  };

  const handleAppStateChange = async (nextAppState: string) => {
    if (nextAppState === 'active' && isWaitingForPayment) {
      console.log('App volvió del navegador, verificando pago...');
      await checkPendingPayment();
    }
  };

  const checkPendingPayment = async () => {
    try {
      setLoading(true);
      
      // Verificar si hay un token pendiente en el backend
      const response = await apiService.get('/payments/webpay/check-pending');
      
      if (response && response.hasPending && response.token) {
        console.log('Token pendiente encontrado:', response.token);

        // Confirmar el pago
        const result = await apiService.confirmWebPayTransaction(response.token);
        const isAuthorized = result?.success === true
          || result?.data?.status === 'AUTHORIZED'
          || result?.transaction?.status === 'AUTHORIZED'
          || (result?.transaction && result.transaction.response_code === 0)
          || result?.status === 'AUTHORIZED';

        if (isAuthorized) {
          // Pago exitoso, actualizar estado y procesar la publicación e inspección
          setPaymentStatus('success');
          setIsWaitingForPayment(false);
          const savedPaymentId = await AsyncStorage.getItem('waitingForPayment');
          await AsyncStorage.removeItem('waitingForPayment');
          await processSuccessfulPayment(savedPaymentId || undefined);
        } else {
          // Pago rechazado
          setIsWaitingForPayment(false);
          await AsyncStorage.removeItem('waitingForPayment');
          
          Alert.alert(
            'Pago Rechazado',
            'Tu pago no pudo ser procesado. Por favor, intenta nuevamente.',
            [{ text: 'OK' }]
          );
          setLoading(false);
        }
      } else {
        // No hay pago pendiente o no se encontró token
        setLoading(false);
      }
    } catch (error) {
      console.error('Error al verificar pago pendiente:', error);
      Alert.alert('Error', 'Hubo un problema al procesar tu pago. Por favor, contacta a soporte.');
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      if (selectedMethod === 'wallet') {
        if (balance < Number(amount)) {
           Alert.alert('Saldo Insuficiente', 'No tienes suficiente saldo para realizar este pago.');
           setLoading(false);
           return;
        }
        
        console.log('Procesando pago con billetera...');
        // Realizar pago con billetera
        const descriptionStr = Array.isArray(description) ? description[0] : description;
        const walletResponse = await apiService.post('/wallet/payment', {
           amount: Number(amount),
           description: descriptionStr || 'Pago de servicio'
        });
        
        console.log('Pago con billetera exitoso', walletResponse);
        // Si no hay error, procesar éxito pasando el paymentId
        if (walletResponse && walletResponse.success) {
          await processSuccessfulPayment(walletResponse.paymentId);
          refreshWallet();
        } else {
          throw new Error('La respuesta del pago no fue exitosa');
        }
        return;
      }

      // MODO WEBPAY: crear registro de Payment en backend, luego crear transacción WebPay
      const user = await authService.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Crear registro de pago para obtener UUID (evita "payment must be UUID")
      const createdPayment = await apiService.post('/payments', {
        usuarioId: user.id,
        monto: Number(amount),
        metodo: 'WebPay',
      });

      const paymentId = createdPayment?.id;
      if (!paymentId) throw new Error('No se pudo crear el registro de pago');

      // Guardar el paymentId para usarlo después al finalizar el pago
      await AsyncStorage.setItem('waitingForPayment', paymentId);

      // Crear transacción de WebPay en el backend
      const webpayData = await apiService.createWebPayTransaction({
        amount: Number(amount),
        returnUrl: `${API_URL}/payments/webpay/callback`,
        paymentId,
      });

      console.log('Respuesta de WebPay:', webpayData);

      if (!webpayData || !webpayData.url) {
        throw new Error('No se recibió una URL válida de WebPay');
      }

      console.log('URL de WebPay:', webpayData.url);

      setIsWaitingForPayment(true);

      // Abrir la URL dentro de la app usando WebView (in-app browser)
      const originalUrl = webpayData.url as string;
      setWebviewUrl(originalUrl);
      setWebviewVisible(true);

      // Mostrar instrucciones de prueba de tarjeta para QA/manual testing
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Completa el Pago',
          'Se ha abierto la página de Transbank.\n\n1. Selecciona la opción "Tarjetas"\n2. Ingresa una tarjeta de prueba:\n\n💳 CRÉDITO:\n6623 4444 4444 4444\n\n💳 DÉBITO (Alternativa):\n6623 4444 4444 4441\n\n3. Fecha: 12/28 | CVV: 123',
          [{ text: 'Entendido' }]
        );
      }
    } catch (error: any) {
      console.error('Error al iniciar pago:', error);
      Alert.alert('Error', error.message || 'No se pudo iniciar el pago');
      setIsWaitingForPayment(false);
      setLoading(false);
    }
  };

  const markPaymentCancelled = async (paymentId?: string, reason?: string) => {
    try {
      if (!paymentId) {
        // Try to read saved paymentId
        paymentId = await AsyncStorage.getItem('waitingForPayment');
      }
      if (!paymentId) return;

      await apiService.fetch(`/payments/${paymentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: 'Fallido', detalles: reason || 'Anulado por el usuario' }),
      });

      // Clean up
      await AsyncStorage.removeItem('waitingForPayment');
      setIsWaitingForPayment(false);
      setPaymentStatus('cancelled');
    } catch (e) {
      console.error('Error marcando pago como anulado:', e);
    }
  };

  const processSuccessfulPayment = async (paymentId?: string) => {
    try {
      // Safety: ensure payment is confirmed in backend before creating any entities
      if (paymentId) {
        try {
          const paymentRecord = await apiService.get(`/payments/${paymentId}`);
          if (!paymentRecord || (paymentRecord.estado && paymentRecord.estado !== 'Completado')) {
            console.warn('Payment not completed according to backend:', paymentRecord);
            setPaymentStatus('cancelled');
            setIsWaitingForPayment(false);
            await AsyncStorage.removeItem('waitingForPayment');
            Alert.alert('Pago no confirmado', 'El pago no fue confirmado. No se creó la publicación ni el vehículo.');
            return;
          }
        } catch (e) {
          console.error('Error comprobando estado de pago en backend:', e);
          setPaymentStatus('cancelled');
          setIsWaitingForPayment(false);
          await AsyncStorage.removeItem('waitingForPayment');
          Alert.alert('Pago no confirmado', 'No se pudo verificar el estado del pago. No se creó la publicación ni el vehículo.');
          return;
        }
      }
      if (!metadata) {
        throw new Error('No se encontraron datos de la publicación');
      }

      const user = await authService.getUser();
      if (!user) throw new Error('Usuario no autenticado');
      
      console.log('👤 [PaymentGateway] Usuario autenticado:', user.id);

      const metadataStr = Array.isArray(metadata) ? metadata[0] : metadata;
      if (!metadataStr) throw new Error('Metadata inválida');

      const vehicleData = JSON.parse(metadataStr);
      console.log('Procesando pago exitoso para vehículo:', vehicleData.plate || vehicleData.patente);
      console.log('Vehicle Data Keys:', Object.keys(vehicleData));

      // 2. Crear publicación (o inspección directa)
      const serviceTypeStr = Array.isArray(serviceType) ? serviceType[0] : serviceType;

      if (serviceTypeStr === 'inspection_only') {
          console.log('Procesando pago de inspección para vehículo existente');
          const { publicationId, inspectionDate, inspectionTime, inspectionLocation, horarioId, solicitanteId } = vehicleData;
          
          let fechaProgramada = null;
          if (inspectionDate && inspectionTime) {
              try {
                  if (inspectionDate.includes('T')) {
                      const dateObj = new Date(inspectionDate);
                      const [hours, minutes] = inspectionTime.split(':');
                      dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                      fechaProgramada = dateObj.toISOString();
                  } else if (inspectionDate.includes('/')) {
                      const [day, month, year] = inspectionDate.split('/');
                      const [hours, minutes] = inspectionTime.split(':');
                      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
                      fechaProgramada = dateObj.toISOString();
                  } else {
                      const dateObj = new Date(inspectionDate);
                      const [hours, minutes] = inspectionTime.split(':');
                      dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                      fechaProgramada = dateObj.toISOString();
                  }
              } catch (e) {
                  console.error('Error parsing date:', e);
              }
          }

          const inspectionPrice = prices.find(p => p.nombre.toLowerCase() === 'inspeccion')?.precio || 40000;

          const inspectionData = {
            solicitanteId: solicitanteId || user.id,
            publicacionId: publicationId,
            valor: inspectionPrice,
            estado_pago: 'Confirmado',
            paymentId: paymentId,
            horarioId: horarioId,
            fechaProgramada: fechaProgramada
          };

          console.log('Creando inspección (inspection_only):', inspectionData);
          await apiService.createInspection(inspectionData);
          
          setPaymentStatus('success');
          setIsWaitingForPayment(false);
          await AsyncStorage.removeItem('waitingForPayment');
          return;
      }

      // Mapear datos al formato que espera el backend (CreateVehicleDto)
      const backendVehicleData = {
        patente: vehicleData.plate || vehicleData.patente,
        marca: vehicleData.brand,
        modelo: vehicleData.model,
        version: vehicleData.version,
        anio: parseInt(vehicleData.year),
        color: vehicleData.color,
        kilometraje: parseInt(vehicleData.kilometers.replace(/\./g, '')),
        transmision: vehicleData.transmission,
        tipoCombustible: vehicleData.fuelType,
        tipoCarroceria: vehicleData.bodyType,
        puertas: parseInt(vehicleData.doors),
        vin: vehicleData.vin,
        motor: vehicleData.motor,
        numeroMotor: vehicleData.numeroMotor,
        tipoVehiculo: vehicleData.tipoVehiculo,
        imagenes: vehicleData.images || []
      };

      console.log('Enviando vehículo al backend:', backendVehicleData);

      const vehicleResponse = await apiService.createVehicle(backendVehicleData);
      
      console.log('Vehículo creado:', vehicleResponse);

      if (!vehicleResponse || !vehicleResponse.id) {
        throw new Error('Error al crear el vehículo');
      }

      // 3. Crear publicación
      const publicationData = {
        usuarioId: user.id,
        vehiculoId: vehicleResponse.id,
        precio: parseInt(vehicleData.price.replace(/\./g, '')),
        descripcion: vehicleData.description,
        tipoPublicacion: 'Venta',
        estado: 'Pendiente'
      };

      console.log('Creando publicación:', publicationData);
      const publicationResponse = await apiService.createPublication(publicationData);

      if (!publicationResponse) {
        throw new Error('Error al crear la publicación');
      }

      console.log('Publicación creada:', publicationResponse);

      // 4. Si es con inspección, agendarla
      if (serviceTypeStr === 'publication_with_inspection') {
        const { inspectionDate, inspectionTime, inspectionLocation } = vehicleData;
        console.log('Agendando inspección...', { inspectionDate, inspectionTime, inspectionLocation });

        let fechaProgramada = new Date().toISOString();
        if (inspectionDate && inspectionTime) {
             const [hours, minutes] = inspectionTime.split(':');
             const dateObj = new Date(inspectionDate);
             dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
             fechaProgramada = dateObj.toISOString();
        }

        const inspectionData = {
          solicitanteId: user.id,
          publicacionId: publicationResponse.id,
          sedeId: inspectionLocation, 
          // horarioId: undefined, // Si tu backend requiere ID de horario, deberás pasarlo aqui
          fechaProgramada: fechaProgramada,
          valor: prices.find(p => p.nombre.toLowerCase() === 'inspeccion')?.precio || 40000,
          estado: 'Solicitada',
          estado_pago: 'Confirmado',
          paymentId: paymentId
        };

        await apiService.createInspection(inspectionData);
        console.log('Inspección creada correctamente');
      }

      setPaymentStatus('success');
      setIsWaitingForPayment(false);
      await AsyncStorage.removeItem('waitingForPayment');

    } catch (error) {
      console.error('Error procesando pago exitoso:', error);
      Alert.alert('Error', 'El pago fue exitoso pero hubo un error al crear la publicación. Contacta a soporte.');
      setPaymentStatus('success'); // Dejar en success para que el usuario vea que pagó, aunque falló el post-proceso
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Procesando...</Text>
        </View>
      );
    }

    if (paymentStatus === 'success') {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          <Text style={styles.successTitle}>¡Pago Exitoso!</Text>
          <Text style={styles.successText}>
            Tu operación ha sido procesada correctamente.
          </Text>
          <Button
            title="Ir a Mis Publicaciones"
            onPress={() => {
                // Navegar al tab de perfil o mis publicaciones
                // router.replace('/(tabs)/profile'); 
                // O dashboard
                router.dismissAll();
                router.replace('/(tabs)/profile');
            }}
            style={styles.homeButton}
          />
        </View>
      );
    }
    
    if (paymentStatus === 'failure' || paymentStatus === 'cancelled') {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="close-circle" size={80} color="#F44336" />
                <Text style={styles.successTitle}>Pago Fallido</Text>
                <Text style={styles.successText}>
                    {paymentStatus === 'cancelled' ? 'Anulaste la operación.' : 'Ocurrió un error al procesar el pago.'}
                </Text>
                <Button
                    title="Intentar Nuevamente"
                    onPress={() => {
                        setPaymentStatus('pending');
                        setIsWaitingForPayment(false);
                        setWebviewVisible(false);
                    }}
                    style={styles.homeButton}
                />
                 <Button
                    variant="outline"
                    title="Volver"
                    onPress={() => router.back()}
                    style={{ marginTop: 10, width: 200 }}
                />
            </View>
        );
    }

    // PENDING STATE
    return (
      <View style={styles.container}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen de Pago</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Servicio:</Text>
            <Text style={styles.value}>
                {Array.isArray(description) ? description[0] : description}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total a Pagar:</Text>
            <Text style={styles.totalValue}>
              ${Number(amount).toLocaleString('es-CL')}
            </Text>
          </View>
        </View>

        <Text style={styles.methodTitle}>Selecciona Medio de Pago</Text>

        <TouchableOpacity 
          style={[styles.methodCard, selectedMethod === 'webpay' && styles.selectedMethod]}
          onPress={() => setSelectedMethod('webpay')}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="card" size={24} color="#333" />
                <Text style={styles.methodText}>WebPay Plus (Débito/Crédito)</Text>
            </View>
            {selectedMethod === 'webpay' && <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.methodCard, selectedMethod === 'wallet' && styles.selectedMethod]}
          onPress={() => setSelectedMethod('wallet')}
        >
             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="wallet" size={24} color="#333" />
                <View>
                    <Text style={styles.methodText}>Billetera AutoBox</Text>
                    <Text style={styles.balanceText}>Saldo: ${balance.toLocaleString()}</Text>
                </View>
            </View>
            {selectedMethod === 'wallet' && <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />}
        </TouchableOpacity>

        <Button
          title={`Pagar $${Number(amount).toLocaleString('es-CL')}`}
          onPress={handlePayment}
          style={styles.payButton}
        />
      </View>
    );
  };

  return (
    <Screen title="Pasarela de Pago" backgroundColor="#F5F5F5">
      {renderContent()}

      <Modal
        visible={webviewVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
            Alert.alert(
                'Cancelar Pago',
                '¿Estás seguro que deseas cancelar el pago?',
                [
                    { text: 'No', style: 'cancel' },
                    { text: 'Sí', style: 'destructive', onPress: () => {
                        setWebviewVisible(false);
                        markPaymentCancelled();
                    }}
                ]
            );
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.webviewHeader}>
                <Text style={styles.webviewTitle}>WebPay</Text>
                <TouchableOpacity onPress={() => {
                     Alert.alert(
                        'Cancelar Pago',
                        '¿Estás seguro que deseas cancelar el pago?',
                        [
                            { text: 'No', style: 'cancel' },
                            { text: 'Sí', style: 'destructive', onPress: () => {
                                setWebviewVisible(false);
                                markPaymentCancelled();
                            }}
                        ]
                    );
                }}>
                    <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
            </View>
            {webviewUrl ? (
                <WebView
                    source={{ uri: webviewUrl }}
                    style={{ flex: 1 }}
                    onNavigationStateChange={(navState) => {
                        // Detectar retorno a la app (deep link) o finalización
                        if (navState.url.includes('payments/webpay/callback') || navState.url.includes('payments/webpay/finish')) {
                             setWebviewVisible(false);
                             checkPendingPayment();
                        }
                    }}
                />
            ) : (
                <View style={[styles.centerContainer, { flex: 1 }]}>
                    <ActivityIndicator size="large" />
                </View>
            )}
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  homeButton: {
    width: '100%',
    maxWidth: 300,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  methodCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedMethod: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  methodText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
  },
  balanceText: {
      fontSize: 14,
      color: '#666',
      marginLeft: 12,
  },
  payButton: {
    marginTop: 'auto',
    marginBottom: 16,
  },
  webviewHeader: {
      height: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
  },
  webviewTitle: {
      fontSize: 16,
      fontWeight: 'bold',
  }
});
