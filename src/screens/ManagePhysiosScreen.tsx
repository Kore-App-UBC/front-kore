import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { apiService } from '../services/api';
import { CreatePhysioData, Physio } from '../types';

export default function ManagePhysiosScreen() {
  const [physios, setPhysios] = useState<Physio[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreatePhysioData>({
    name: '',
    email: '',
    phone: '',
  });

  const handleCreatePhysio = async () => {
    if (!form.name || !form.email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    try {
      setLoading(true);
      const newPhysio = await apiService.createPhysio(form);
      setPhysios(prev => [...prev, newPhysio]);
      Alert.alert('Success', 'Physiotherapist created successfully');
      // Reset form
      setForm({ name: '', email: '', phone: '' });
    } catch (error) {
      Alert.alert('Error', 'Failed to create physiotherapist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1">
      <ThemedView className="p-6">
        <ThemedText type="title" className="mb-6">Manage Physiotherapists</ThemedText>

        <ThemedView className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
          <ThemedText type="subtitle" className="mb-4">Create New Physiotherapist</ThemedText>

          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-3 text-black dark:text-white"
            placeholder="Name"
            value={form.name}
            onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
          />

          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-3 text-black dark:text-white"
            placeholder="Email"
            value={form.email}
            onChangeText={(text) => setForm(prev => ({ ...prev, email: text }))}
            keyboardType="email-address"
          />

          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-4 text-black dark:text-white"
            placeholder="Phone (optional)"
            value={form.phone}
            onChangeText={(text) => setForm(prev => ({ ...prev, phone: text }))}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            className="bg-blue-500 p-3 rounded-lg"
            onPress={handleCreatePhysio}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <ThemedText className="text-white text-center font-bold">Create Physiotherapist</ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>

        <ThemedText type="subtitle" className="mb-4">Created Physiotherapists</ThemedText>

        {physios.length === 0 ? (
          <ThemedText className="text-center text-gray-500">No physiotherapists created yet</ThemedText>
        ) : (
          physios.map((physio) => (
            <ThemedView key={physio.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 shadow">
              <ThemedText type="defaultSemiBold" className="mb-1">{physio.name}</ThemedText>
              <ThemedText className="mb-1">{physio.email}</ThemedText>
              {physio.phone && <ThemedText className="text-gray-600 dark:text-gray-400">{physio.phone}</ThemedText>}
              <ThemedText className="text-sm text-gray-500 mt-2">
                Created: {new Date(physio.createdAt).toLocaleDateString()}
              </ThemedText>
            </ThemedView>
          ))
        )}
      </ThemedView>
    </ScrollView>
  );
}