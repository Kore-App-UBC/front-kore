import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { apiService } from '../services/api';
import { SubmissionQueueItem } from '../types';

export default function SubmissionQueueScreen() {
  const navigation = useNavigation();
  const [submissions, setSubmissions] = useState<SubmissionQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSubmissionQueue();
      setSubmissions(data);
    } catch (err) {
      setError('Failed to load submissions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubmissions();
    setRefreshing(false);
  };

  const handleSubmissionPress = (submissionId: string) => {
    navigation.navigate('SubmissionDetail', { submissionId });
  };

  const renderSubmission = ({ item }: { item: SubmissionQueueItem }) => (
    <TouchableOpacity
      className="bg-white p-4 mb-2 mx-4 rounded-lg shadow-sm border border-gray-200"
      onPress={() => handleSubmissionPress(item.id)}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <ThemedText className="text-lg font-semibold">{item.patientName}</ThemedText>
          <ThemedText className="text-gray-600">{item.exerciseName}</ThemedText>
          <ThemedText className="text-xs text-gray-400 mt-1">
            Submitted: {new Date(item.submittedAt).toLocaleString()}
          </ThemedText>
        </View>
        <View className={`px-2 py-1 rounded ${
          item.status === 'pending' ? 'bg-yellow-100' : 'bg-green-100'
        }`}>
          <ThemedText className={`text-xs font-medium ${
            item.status === 'pending' ? 'text-yellow-800' : 'text-green-800'
          }`}>
            {item.status === 'pending' ? 'Pending' : 'Reviewed'}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText className="text-lg">Loading submissions...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText className="text-lg text-red-500 mb-4">{error}</ThemedText>
        <TouchableOpacity
          className="px-4 py-2 bg-blue-500 rounded"
          onPress={fetchSubmissions}
        >
          <ThemedText className="text-white">Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <ThemedText type="title" className="p-4">Submission Queue</ThemedText>
      {submissions.length === 0 ? (
        <ThemedView className="flex-1 justify-center items-center">
          <ThemedText className="text-lg">No submissions to review</ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={submissions}
          renderItem={renderSubmission}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </ThemedView>
  );
}