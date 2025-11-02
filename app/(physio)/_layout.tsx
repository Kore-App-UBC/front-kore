import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Tabs } from 'expo-router';
import React, { useEffect } from 'react';

import LogoutButton from '@/src/components/LogoutButton';
import { useFloatingTabOptions } from '@/src/components/useFloatingTabOptions';
import { useAuthStore } from '../../src/state/authStore';

export default function PhysioTabLayout() {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'PHYSIOTHERAPIST') {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, user, router]);

  const headerRight = () => (
    <LogoutButton />
  );

  const { screenOptions } = useFloatingTabOptions(headerRight);

  const renderIcon = (
    focusedName: React.ComponentProps<typeof Ionicons>['name'],
    outlineName: React.ComponentProps<typeof Ionicons>['name'],
  ) => ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons
      name={focused ? focusedName : outlineName}
      size={22}
      color={color}
      style={{ marginBottom: -4 }}
    />
  );

  return (
    <Tabs
      screenOptions={{...screenOptions }}
    >
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Pacientes',
          tabBarIcon: renderIcon('people', 'people-outline'),
        }}
      />
      <Tabs.Screen
        name="submission-queue"
        options={{
          title: 'Fila de Envios',
          tabBarIcon: renderIcon('file-tray-full', 'file-tray-full-outline'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: renderIcon('person-circle', 'person-circle-outline'),
        }}
      />
      <Tabs.Screen
        name="submission-detail"
        options={{ title: 'Submission Details', href: null }}
      />
    </Tabs>
  );
}