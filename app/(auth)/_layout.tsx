import { Redirect, Slot } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuthStore } from '../../src/state/authStore';

export default function AuthLayout() {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Force re-render when authentication state changes
  }, [isAuthenticated, user]);

  if (isAuthenticated && user) {
    if (user.role === 'PATIENT') {
      return <Redirect href="/(patient)/exercises" />;
    } else if (user.role === 'PHYSIOTHERAPIST') {
      return <Redirect href="/(physio)/patients" />;
    } else if (user.role === 'MANAGER') {
      return <Redirect href="/(manager)/metrics" />;
    }
  }

  return <Slot />;
}