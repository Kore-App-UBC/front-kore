import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView } from 'react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { apiService } from '../services/api';
import { Metrics } from '../types';

export default function MetricsScreen() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getMetrics();
      setMetrics(data);
    } catch (err) {
      setError('Failed to load metrics');
      Alert.alert('Error', 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
        <ThemedText className="mt-4">Loading metrics...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView className="flex-1 justify-center items-center p-4">
        <ThemedText className="text-red-500 text-center mb-4">{error}</ThemedText>
        <ThemedText
          className="text-blue-500 underline"
          onPress={fetchMetrics}
        >
          Try Again
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView className="flex-1">
      <ThemedView className="p-6">
        <ThemedText type="title" className="mb-6">Manager Metrics</ThemedText>

        {metrics && (
          <ThemedView className="space-y-4">
            <ThemedView className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <ThemedText type="subtitle" className="mb-2">Total Patients</ThemedText>
              <ThemedText className="text-2xl font-bold text-blue-600">{metrics.totalPatients}</ThemedText>
            </ThemedView>

            <ThemedView className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <ThemedText type="subtitle" className="mb-2">Total Physiotherapists</ThemedText>
              <ThemedText className="text-2xl font-bold text-green-600">{metrics.totalPhysios}</ThemedText>
            </ThemedView>

            <ThemedView className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <ThemedText type="subtitle" className="mb-2">Total Exercises</ThemedText>
              <ThemedText className="text-2xl font-bold text-purple-600">{metrics.totalExercises}</ThemedText>
            </ThemedView>

            <ThemedView className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <ThemedText type="subtitle" className="mb-2">Active Sessions</ThemedText>
              <ThemedText className="text-2xl font-bold text-orange-600">{metrics.activeSessions}</ThemedText>
            </ThemedView>

            <ThemedView className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <ThemedText type="subtitle" className="mb-2">Completed Sessions</ThemedText>
              <ThemedText className="text-2xl font-bold text-teal-600">{metrics.completedSessions}</ThemedText>
            </ThemedView>
          </ThemedView>
        )}
      </ThemedView>
    </ScrollView>
  );
}