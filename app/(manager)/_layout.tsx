import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';

import LogoutButton from '../../src/components/LogoutButton';
import { useFloatingTabOptions } from '../../src/components/useFloatingTabOptions';
import { useAuthStore } from '../../src/state/authStore';

export default function ManagerTabLayout() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'MANAGER') {
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
      screenOptions={{ ...screenOptions }}
    >
      <Tabs.Screen
        name="metrics"
        options={{
          title: 'Métricas',
          tabBarIcon: renderIcon('analytics', 'analytics-outline'),
        }}
      />
      <Tabs.Screen
        name="manage-patients"
        options={{
          title: 'Gerenciar Pacientes',
          tabBarIcon: renderIcon('people', 'people-outline'),
        }}
      />
      <Tabs.Screen
        name="manage-physios"
        options={{
          title: 'Gerenciar Fisioterapeutas',
          tabBarIcon: renderIcon('medkit', 'medkit-outline'),
        }}
      />
      <Tabs.Screen
        name="manage-exercises"
        options={{
          title: 'Gerenciar Exercícios',
          tabBarIcon: renderIcon('construct', 'construct-outline'),
        }}
      />
    </Tabs>
  );
}