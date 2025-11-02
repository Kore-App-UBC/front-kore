import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import LogoutButton from '../../src/components/LogoutButton';
import { useFloatingTabOptions } from '../../src/components/useFloatingTabOptions';
import { useAuthStore } from '../../src/state/authStore';

export default function PatientTabLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || user?.role !== 'PATIENT') {
    return <Redirect href="/(auth)/login" />;
  }

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
          title: 'Exercises',
          tabBarIcon: renderIcon('barbell', 'barbell-outline'),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: renderIcon('time', 'time-outline'),
        }}
      />
      <Tabs.Screen
        name="exercise-detail"
        options={{
          title: 'Exercise Detail',
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}