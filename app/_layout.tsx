import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'react-native';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('🔔 Notification clicked (Root):', data);
      
      if (data?.actionUrl) {
        try {
          router.push(data.actionUrl as any);
        } catch (error) {
          console.error('Error navigating from notification:', error);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(mechanic)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="register" />
        <Stack.Screen name="loading" />
        <Stack.Screen name="setup-avatar" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="payment-callback" />
      </Stack>
    </>
  );
}
