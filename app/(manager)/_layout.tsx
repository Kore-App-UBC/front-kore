import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { useAuthStore } from '../../src/state/authStore';

export default function ManagerTabLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || user?.role !== 'MANAGER') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs>
      <Tabs.Screen name="metrics" options={{ title: 'Metrics' }} />
      <Tabs.Screen name="manage-patients" options={{ title: 'Manage Patients' }} />
      <Tabs.Screen name="manage-physios" options={{ title: 'Manage Physios' }} />
    </Tabs>
  );
}