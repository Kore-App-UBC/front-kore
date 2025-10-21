import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { apiService } from '../services/api';
import { Patient } from '../types';

export default function PatientsScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAssignedPatients();
      setPatients(data);
    } catch (err) {
      setError('Failed to load patients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPatients();
    setRefreshing(false);
  };

  const renderPatient = ({ item }: { item: Patient }) => (
    <TouchableOpacity className="bg-transparent p-4 mb-2 mx-4 rounded-lg shadow-sm border border-gray-200 min-w-[50vw]">
      <ThemedText className="text-lg font-semibold">{item.user.name}</ThemedText>
      <ThemedText className="text-gray-600">{item.user.email}</ThemedText>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText className="text-lg">Loading patients...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText className="text-lg text-red-500 mb-4">{error}</ThemedText>
        <TouchableOpacity
          className="px-4 py-2 bg-blue-500 rounded"
          onPress={fetchPatients}
        >
          <ThemedText className="text-white">Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <ThemedText type="title" className="p-4">My Patients</ThemedText>
      {patients.length === 0 ? (
        <ThemedView className="flex-1 justify-center items-center">
          <ThemedText className="text-lg">No patients assigned</ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={patients}
          renderItem={renderPatient}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </ThemedView>
  );
}