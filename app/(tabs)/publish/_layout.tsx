import { Stack } from 'expo-router';
import React from 'react';

export default function PublishLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="raw-publish" />
      <Stack.Screen name="publish-with-inspection" />
      <Stack.Screen name="payment-gateway" />
    </Stack>
  );
}
