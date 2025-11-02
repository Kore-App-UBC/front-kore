import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import LogoutButton from '../../src/components/LogoutButton';
import { useFloatingTabOptions } from '../../src/components/useFloatingTabOptions';
import { useAuthStore } from '../../src/state/authStore';

export default function ManagerTabLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || user?.role !== 'MANAGER') {
    return <Redirect href="/(auth)/login" />;
  }

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
          title: 'Metrics',
          tabBarIcon: renderIcon('analytics', 'analytics-outline'),
        }}
      />
      <Tabs.Screen
        name="manage-patients"
        options={{
          title: 'Manage Patients',
          tabBarIcon: renderIcon('people', 'people-outline'),
        }}
      />
      <Tabs.Screen
        name="manage-physios"
        options={{
          title: 'Manage Physios',
          tabBarIcon: renderIcon('medkit', 'medkit-outline'),
        }}
      />
      <Tabs.Screen
        name="manage-exercises"
        options={{
          title: 'Manage Exercises',
          tabBarIcon: renderIcon('construct', 'construct-outline'),
        }}
      />
    </Tabs>
  );
}