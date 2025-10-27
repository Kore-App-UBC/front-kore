import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { ThemedText } from './themed-text';

export default function LogoutButton() {
  const { signOut, loading } = useAuth();

  const handleLogout = async () => {
    signOut();
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
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});