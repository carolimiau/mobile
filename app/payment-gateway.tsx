import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Linking, AppState, Platform, TouchableOpacity, Modal, SafeAreaView, useWindowDimensions, StatusBar, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '../components/ui/Screen';
import { Button } from '../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import apiService from '../services/apiService';
import authService from '../services/authService';
import { useWallet } from '../hooks/useWallet';
import { API_URL, LOCAL_IP } from '../constants/Config';

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
        marca: vehicleData.brand || vehicleData.marca,
        modelo: vehicleData.model || vehicleData.modelo,
        anio: Number(vehicleData.year || vehicleData.anio),
        version: vehicleData.version,
        kilometraje: Number(vehicleData.kilometers || vehicleData.kilometraje),
        combustible: vehicleData.fuelType || vehicleData.combustible,
        transmision: vehicleData.transmission || vehicleData.transmision,
        tipoVehiculo: vehicleData.tipoVehiculo || vehicleData.bodyType,
        color: vehicleData.color,
        puertas: vehicleData.doors ? Number(vehicleData.doors || vehicleData.puertas) : undefined,
        vin: vehicleData.vin,
        numeroMotor: vehicleData.numeroMotor,
        motor: vehicleData.motor || undefined,
        mesRevisionTecnica: vehicleData.mesRevisionTecnica,
        // Otros campos que no son del vehículo pero se usan después
        inspectionDate: vehicleData.inspectionDate,
        inspectionTime: vehicleData.inspectionTime,
        inspectionLocation: vehicleData.inspectionLocation,
        horarioId: vehicleData.horarioId,
      };

      if (!backendVehicleData.patente) {
          console.error('Falta la patente en los datos del vehículo:', vehicleData);
          throw new Error('La patente es requerida para crear el vehículo');
      }

      // 1. Crear vehículo
      const vehicle = await apiService.createVehicle(backendVehicleData);
      console.log('Vehículo creado:', vehicle.id);

      const publicationData = {
        vehiculoId: vehicle.id,
        vendedorId: user.id,
        valor: Number(vehicleData.price),
        descripcion: vehicleData.description,
        fotos: vehicleData.images || [],
        estado: serviceTypeStr === 'raw_publish' ? 'Publicada' : 'Pendiente',
        paymentId: paymentId // Pass paymentId to link
      };
      console.log('Creando publicación:', publicationData);
      const publication = await apiService.createPublication(publicationData);
      console.log('Publicación creada:', publication.id);

      // 3. Crear inspección (Solo si NO es raw_publish)
      if (serviceTypeStr !== 'raw_publish') {
        // Combinar fecha y hora para fechaProgramada
        let fechaProgramada = null;
        if (vehicleData.inspectionDate && vehicleData.inspectionTime) {
          // Asumiendo formato DD/MM/YYYY para date y HH:MM para time
          // O formato ISO si viene del DatePicker
          try {
              // Si es ISO string
              if (vehicleData.inspectionDate.includes('T')) {
                  const dateObj = new Date(vehicleData.inspectionDate);
                  const [hours, minutes] = vehicleData.inspectionTime.split(':');
                  dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                  fechaProgramada = dateObj.toISOString();
              } else if (vehicleData.inspectionDate.includes('/')) {
                  // Si es DD/MM/YYYY
                  const [day, month, year] = vehicleData.inspectionDate.split('/');
                  const [hours, minutes] = vehicleData.inspectionTime.split(':');
                  const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
                  fechaProgramada = dateObj.toISOString();
              } else {
                  // Intentar parsear directo
                  const dateObj = new Date(vehicleData.inspectionDate);
                  const [hours, minutes] = vehicleData.inspectionTime.split(':');
                  dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                  fechaProgramada = dateObj.toISOString();
              }
          } catch (e) {
              console.error('Error parsing date:', e);
          }
        }

        const inspectionPrice = prices.find(p => p.nombre.toLowerCase() === 'inspeccion')?.precio || 40000;

        const inspectionData = {
          solicitanteId: null, // Explicitly null for Publish with Inspection (Seller is not a Solicitante in this context)
          publicacionId: publication.id,
          valor: inspectionPrice,
          estado_pago: 'Confirmado',
          paymentId: paymentId,
          horarioId: vehicleData.horarioId,
          fechaProgramada: fechaProgramada
        };

        console.log('Creando inspección (publish_with_inspection):', inspectionData);
        const inspection = await apiService.createInspection(inspectionData);
        console.log('Inspección creada:', inspection.id);
      } else {
        console.log('Skipping inspection creation for raw_publish');
      }

      // 4. Confirmar pago de inspección (si es necesario explícitamente)
      // await apiService.patch(`/inspections/${inspection.id}/confirm-payment`);

      setPaymentStatus('success');
      setIsWaitingForPayment(false);
      await AsyncStorage.removeItem('waitingForPayment');

    } catch (error: any) {
      console.error('Error en proceso final:', error);
      Alert.alert('Error', error.message || 'Ocurrió un error al finalizar el proceso, pero el pago fue exitoso. Contacta a soporte.');
      setPaymentStatus('failure'); // O success con advertencia
    } finally {
      setLoading(false);
    }
  };

  const handleWebviewNavigation = async (navState: any) => {
    const url: string = navState?.url || '';
    if (!url) return;

    // If Transbank redirected back to our callback or attempted deep link
    try {
      let token: string | null = null;

      if (url.startsWith('autobox://')) {
        const m = url.match(/token_ws=([^&]+)/);
        if (m) token = decodeURIComponent(m[1]);
      } else if (url.includes('status=cancel') || url.includes('cancel') || url.includes('anulado')) {
        // Detected possible cancellation from provider
        const savedPaymentId = await AsyncStorage.getItem('waitingForPayment');
        await markPaymentCancelled(savedPaymentId || undefined, 'Usuario canceló en proveedor');
        // Close webview
        setWebviewVisible(false);
        setWebviewUrl(null);
        return;
      } else if (url.includes('token_ws=')) {
        const parts = url.split('token_ws=');
        token = parts[1]?.split('&')[0];
      } else if (url.includes('/payments/webpay/callback')) {
        const m = url.match(/token_ws=([^&]+)/) || url.match(/token=([^&]+)/);
        if (m) token = decodeURIComponent(m[1]);
      }

      if (token) {
        // Close webview
        setWebviewVisible(false);
        setWebviewUrl(null);

        // Confirm transaction immediately
        try {
          const result = await apiService.confirmWebPayTransaction(token);
          const isAuthorized = result?.success === true
            || result?.data?.status === 'AUTHORIZED'
            || result?.transaction?.status === 'AUTHORIZED'
            || (result?.transaction && result.transaction.response_code === 0)
            || result?.status === 'AUTHORIZED';

          if (isAuthorized) {
            setPaymentStatus('success');
            setIsWaitingForPayment(false);
            const savedPaymentId = await AsyncStorage.getItem('waitingForPayment');
            await AsyncStorage.removeItem('waitingForPayment');
            await processSuccessfulPayment(savedPaymentId || undefined);
          } else {
            // Mark payment as failed in backend
            const savedPaymentId = await AsyncStorage.getItem('waitingForPayment');
            await markPaymentCancelled(savedPaymentId || undefined, 'Transbank rechazó la transacción');
            Alert.alert('Pago Rechazado', 'Tu pago fue rechazado por Transbank.');
          }
        } catch (e: any) {
          console.error('Error confirmando transacción desde WebView:', e);
          // If confirmation failed, mark as failed locally
          const savedPaymentId = await AsyncStorage.getItem('waitingForPayment');
          await markPaymentCancelled(savedPaymentId || undefined, 'Error al confirmar transacción');
          Alert.alert('Error', 'No se pudo confirmar el pago. Intenta nuevamente.');
        }
      } else {
        // No token found in URL
        console.warn('WebView navigation without token detected for URL:', url);

        // If the callback path was hit but no token was provided, try to ask the backend
        if (url.includes('/payments/webpay/callback') || url.startsWith('autobox://') || url.includes('payment-callback')) {
          try {
            const pending = await apiService.get('/payments/webpay/check-pending');
            if (pending && pending.hasPending && pending.token) {
              console.log('Found pending token from backend:', pending.token);
              // Close webview
              setWebviewVisible(false);
              setWebviewUrl(null);
              const result = await apiService.confirmWebPayTransaction(pending.token);
              const isAuthorized = result?.success === true
                || result?.data?.status === 'AUTHORIZED'
                || result?.transaction?.status === 'AUTHORIZED'
                || (result?.transaction && result.transaction.response_code === 0)
                || result?.status === 'AUTHORIZED';

              if (isAuthorized) {
                setPaymentStatus('success');
                setIsWaitingForPayment(false);
                const savedPaymentId = await AsyncStorage.getItem('waitingForPayment');
                await AsyncStorage.removeItem('waitingForPayment');
                await processSuccessfulPayment(savedPaymentId || undefined);
              } else {
                const savedPaymentId = await AsyncStorage.getItem('waitingForPayment');
                await markPaymentCancelled(savedPaymentId || undefined, 'Transbank rechazó la transacción');
                Alert.alert('Pago Rechazado', 'Tu pago fue rechazado por Transbank.');
              }
              return;
            }
          } catch (e) {
            console.error('Error checking pending token after callback without token:', e);
          }

          // If no pending token, treat as cancelled
          const savedPaymentId = await AsyncStorage.getItem('waitingForPayment');
          await markPaymentCancelled(savedPaymentId || undefined, 'Token ausente en callback');
          setWebviewVisible(false);
          setWebviewUrl(null);
          return;
        }
      }
    } catch (e) {
      console.warn('Error parsing WebView URL:', e);
    }
  };
  

  // Handle Android hardware back button when webview is open
  useEffect(() => {
    if (!webviewVisible) return;

    const onBackPress = () => {
      setWebviewVisible(false);
      setWebviewUrl(null);
      return true; // prevent default behaviour
    };

    // BackHandler.addEventListener returns a subscription with .remove() in modern RN
    // but some environments (web) may not provide it. Handle both cases safely.
    let sub: any = null;
    if (BackHandler && typeof BackHandler.addEventListener === 'function') {
      try {
        sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      } catch (e) {
        console.warn('BackHandler.addEventListener threw:', e);
      }
    }

    return () => {
      if (sub && typeof sub.remove === 'function') {
        sub.remove();
      } else if (BackHandler && typeof (BackHandler as any).removeEventListener === 'function') {
        try {
          (BackHandler as any).removeEventListener('hardwareBackPress', onBackPress);
        } catch (e) {
          // ignore
        }
      }
    };
  }, [webviewVisible]);

  const handleContinue = () => {
    // Navigate to success screen or home
    router.replace('/(tabs)/inspections'); 
  };

  if (paymentStatus === 'success') {
    return (
      <Screen backgroundColor="#FFF">
        <View style={styles.container}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          <Text style={styles.title}>¡Pago Exitoso!</Text>
          <Text style={styles.subtitle}>Tu transacción ha sido procesada correctamente.</Text>
          <Button title="Continuar" onPress={handleContinue} style={styles.button} />
        </View>
      </Screen>
    );
  }

  if (paymentStatus === 'cancelled') {
    return (
      <Screen backgroundColor="#FFF">
        <View style={styles.container}>
          <Ionicons name="close-circle" size={80} color="#F44336" />
          <Text style={styles.title}>Pago Anulado</Text>
          <Text style={styles.subtitle}>El pago fue anulado correctamente.</Text>
          <Button title="Volver" onPress={() => router.replace('/(tabs)/inspections')} style={styles.button} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#F5F5F5">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pasarela de Pago</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Servicio</Text>
          <Text style={styles.value}>{description || 'Servicio AutoBox'}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.label}>Total a Pagar</Text>
          <Text style={styles.amount}>${Number(amount).toLocaleString('es-CL')}</Text>
        </View>

        <View style={styles.paymentMethods}>
          <Text style={styles.sectionTitle}>Método de Pago</Text>
          
          <TouchableOpacity 
            style={[styles.methodCard, selectedMethod === 'webpay' && styles.selectedMethod]} 
            onPress={() => setSelectedMethod('webpay')}
          >
            <Ionicons name="card" size={24} color="#333" />
            <Text style={styles.methodText}>WebPay Plus</Text>
            <Ionicons 
              name={selectedMethod === 'webpay' ? "radio-button-on" : "radio-button-off"} 
              size={24} 
              color={selectedMethod === 'webpay' ? "#4CAF50" : "#999"} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.methodCard, selectedMethod === 'wallet' && styles.selectedMethod]} 
            onPress={() => setSelectedMethod('wallet')}
          >
            <Ionicons name="wallet" size={24} color="#333" />
            <View style={styles.walletTextContainer}>
              <View style={styles.walletRow}>
                <Text style={styles.methodTextNoMargin}>Saldo AutoBox</Text>
                <Text style={styles.balanceTextSide}> (Disp: ${balance.toLocaleString('es-CL')})</Text>
              </View>
            </View>
            <Ionicons 
              name={selectedMethod === 'wallet' ? "radio-button-on" : "radio-button-off"} 
              size={24} 
              color={selectedMethod === 'wallet' ? "#4CAF50" : "#999"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Button 
          title={loading ? "Procesando..." : "Pagar Ahora"} 
          onPress={handlePayment}
          loading={loading}
          disabled={loading}
        />
        <Button 
          title="Cancelar" 
          variant="outline" 
          onPress={() => router.back()} 
          style={{ marginTop: 12 }}
          disabled={loading}
        />
      </View>
      {webviewVisible && (
        <Modal
          visible={webviewVisible}
          animationType="slide"
          supportedOrientations={["portrait", "landscape"]}
          presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
          onRequestClose={async () => { const savedPaymentId = await AsyncStorage.getItem('waitingForPayment'); await markPaymentCancelled(savedPaymentId || undefined, 'Usuario cerró modal'); setWebviewVisible(false); setWebviewUrl(null); }}
        >
          <SafeAreaView style={styles.webviewContainer}>
            <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'} />
            <View style={[styles.webviewHeader, isLandscape && styles.webviewHeaderLandscape]}>
              <TouchableOpacity style={styles.cancelButton} onPress={async () => { const savedPaymentId = await AsyncStorage.getItem('waitingForPayment'); await markPaymentCancelled(savedPaymentId || undefined, 'Usuario canceló desde modal'); setWebviewVisible(false); setWebviewUrl(null); }}>
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>

              <View style={styles.webviewTitleContainer}>
                <Text style={styles.webviewTitle}>Pago WebPay</Text>
                {webviewUrl ? (
                  <Text style={styles.webviewUrl} numberOfLines={1} ellipsizeMode="middle" selectable>{webviewUrl}</Text>
                ) : (
                  <Text style={styles.webviewUrlPlaceholder}>Cargando...</Text>
                )}
              </View>

              <TouchableOpacity style={styles.cancelAction} onPress={async () => { const savedPaymentId = await AsyncStorage.getItem('waitingForPayment'); await markPaymentCancelled(savedPaymentId || undefined, 'Usuario canceló desde modal'); setWebviewVisible(false); setWebviewUrl(null); }}>
                <Text style={styles.cancelActionText}>Cancelar</Text>
              </TouchableOpacity>
            </View>

            {webviewUrl ? (
              <WebView
                source={{ uri: webviewUrl }}
                onNavigationStateChange={handleWebviewNavigation}
                startInLoadingState
                style={styles.webview}
              />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 16,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  paymentMethods: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    marginBottom: 12,
  },
  selectedMethod: {
    backgroundColor: '#F0F9F0',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  methodText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  methodTextNoMargin: {
    fontSize: 16,
    fontWeight: '500',
  },
  walletTextContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  balanceTextSide: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  button: {
    width: '100%',
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  webviewHeader: {
    height: 72,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    flexDirection: 'row',
    alignItems: 'center',
  },
  webviewHeaderLandscape: {
    height: 56,
    paddingHorizontal: 8,
  },
  cancelButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webviewTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  webviewUrl: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    paddingHorizontal: 12,
    width: '100%'
  },
  webviewUrlPlaceholder: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  cancelAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    marginLeft: 8,
  },
  cancelActionText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webviewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
