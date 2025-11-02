import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { ThemedText } from './themed-text';

export default function LogoutButton() {
  const { signOut, loading } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.buttonDisabled]}
      onPress={handleLogout}
      disabled={loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!loading }}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" style={styles.icon} />
        ) : (
          <MaterialIcons name="exit-to-app" size={18} color="#fff" style={styles.icon} />
        )}

        <ThemedText style={styles.buttonText}>
          {loading ? 'Saindo...' : 'Sair'}
        </ThemedText>
      </View>
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 10,
  },
});