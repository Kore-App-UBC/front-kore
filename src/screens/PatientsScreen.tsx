import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
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
    <TouchableOpacity className="bg-white p-4 mb-2 mx-4 rounded-lg shadow-sm border border-gray-200">
      <Text className="text-lg font-semibold text-gray-800">{item.name}</Text>
      <Text className="text-gray-600">{item.email}</Text>
      {item.phone && <Text className="text-gray-500">{item.phone}</Text>}
      {item.dateOfBirth && (
        <Text className="text-gray-500">
          DOB: {new Date(item.dateOfBirth).toLocaleDateString()}
        </Text>
      )}
      <Text className="text-xs text-gray-400 mt-1">
        Assigned: {new Date(item.assignedAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-lg text-gray-600">Loading patients...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-lg text-red-500 mb-4">{error}</Text>
        <TouchableOpacity
          className="px-4 py-2 bg-blue-500 rounded"
          onPress={fetchPatients}
        >
          <Text className="text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Text className="text-2xl font-bold p-4 text-gray-800">My Patients</Text>
      {patients.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg text-gray-500">No patients assigned</Text>
        </View>
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
    </View>
  );
}