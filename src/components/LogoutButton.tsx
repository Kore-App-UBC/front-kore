import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { ThemedText } from './themed-text';

type LogoutButtonProps = {
  onLogout?: () => void;
};

export default function LogoutButton({ onLogout }: LogoutButtonProps) {
  const { signOut, loading } = useAuth();

  const handleLogout = async () => {
    await signOut();
    onLogout?.();
  };

  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.buttonDisabled]}
      onPress={handleLogout}
      disabled={loading}
    >
      <ThemedText style={styles.buttonText}>
        {loading ? 'Logging out...' : 'Logout'}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#EF4565',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: 'rgba(4, 8, 20, 0.8)',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#7A86A8',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});