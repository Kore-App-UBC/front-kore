import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { useAuthStore } from '../../src/state/authStore';

export default function PatientTabLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || user?.role !== 'PATIENT') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs>
      <Tabs.Screen name="exercises" options={{ title: 'Exercises' }} />
      <Tabs.Screen name="real-time-session" options={{ title: 'Real Time Session' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
    </Tabs>
  );
}