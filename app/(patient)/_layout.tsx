import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import LogoutButton from '../../src/components/LogoutButton';
import { useAuthStore } from '../../src/state/authStore';

export default function PatientTabLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || user?.role !== 'PATIENT') {
    return <Redirect href="/(auth)/login" />;
  }

  const headerRight = () => (
    <LogoutButton />
  );

  return (
    <Tabs>
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercises',
          headerRight,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          headerRight,
        }}
      />
      <Tabs.Screen
        name="exercise-detail"
        options={{
          title: 'Exercise Detail',
          headerRight,
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}