import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Tabs } from 'expo-router';
import React, { useEffect } from 'react';

import LogoutButton from '../../src/components/LogoutButton';
import { useFloatingTabOptions } from '../../src/components/useFloatingTabOptions';
import { useAuthStore } from '../../src/state/authStore';

export default function PatientTabLayout() {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'PATIENT') {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, user, router]);

  const headerRight = () => (
    <LogoutButton />
  );

  const { screenOptions, tabPaddingBottom: sceneContainerStyle } = useFloatingTabOptions(headerRight);

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
      screenOptions={screenOptions}
    >
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercícios',
          tabBarIcon: renderIcon('barbell', 'barbell-outline'),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Histórico',
          tabBarIcon: renderIcon('time', 'time-outline'),
        }}
      />
      <Tabs.Screen
        name="exercise-detail"
        options={{
          title: 'Detalhe do Exercício',
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}