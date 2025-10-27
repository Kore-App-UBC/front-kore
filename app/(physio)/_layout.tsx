import LogoutButton from '@/src/components/LogoutButton';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { useAuthStore } from '../../src/state/authStore';

export default function PhysioTabLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || user?.role !== 'PHYSIOTHERAPIST') {
    return <Redirect href="/(auth)/login" />;
  }

  const headerRight = () => (
    <LogoutButton />
  );

  return (
    <Tabs>
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          headerRight,
        }}
      />
      <Tabs.Screen
        name="submission-queue"
        options={{
          title: 'Submission Queue',
          headerRight,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerRight,
        }}
      />
      <Tabs.Screen
        name="submission-detail"
        options={{ href: null }}
      />
    </Tabs>
  );
}