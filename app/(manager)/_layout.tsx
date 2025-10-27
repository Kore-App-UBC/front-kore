import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import LogoutButton from '../../src/components/LogoutButton';
import { useAuthStore } from '../../src/state/authStore';

export default function ManagerTabLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || user?.role !== 'MANAGER') {
    return <Redirect href="/(auth)/login" />;
  }

  const headerRight = () => (
    <LogoutButton />
  );

  return (
    <Tabs>
      <Tabs.Screen
        name="metrics"
        options={{
          title: 'Metrics',
          headerRight,
        }}
      />
      <Tabs.Screen
        name="manage-patients"
        options={{
          title: 'Manage Patients',
          headerRight,
        }}
      />
      <Tabs.Screen
        name="manage-physios"
        options={{
          title: 'Manage Physios',
          headerRight,
        }}
      />
      <Tabs.Screen
        name="manage-exercises"
        options={{
          title: 'Manage Exercises',
          headerRight,
        }}
      />
    </Tabs>
  );
}