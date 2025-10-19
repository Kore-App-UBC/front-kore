import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { useAuthStore } from '../../src/state/authStore';

export default function PhysioTabLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || user?.role !== 'PHYSIOTHERAPIST') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs>
      <Tabs.Screen name="patients" options={{ title: 'Patients' }} />
      <Tabs.Screen name="submission-queue" options={{ title: 'Submission Queue' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen
        name="submission-detail"
        options={{ href: null }}
      />
    </Tabs>
  );
}