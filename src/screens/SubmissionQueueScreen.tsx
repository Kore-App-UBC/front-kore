import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
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
          <Text className="text-lg font-semibold text-gray-800">{item.patientName}</Text>
          <Text className="text-gray-600">{item.exerciseName}</Text>
          <Text className="text-xs text-gray-400 mt-1">
            Submitted: {new Date(item.submittedAt).toLocaleString()}
          </Text>
        </View>
        <View className={`px-2 py-1 rounded ${
          item.status === 'pending' ? 'bg-yellow-100' : 'bg-green-100'
        }`}>
          <Text className={`text-xs font-medium ${
            item.status === 'pending' ? 'text-yellow-800' : 'text-green-800'
          }`}>
            {item.status === 'pending' ? 'Pending' : 'Reviewed'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-lg text-gray-600">Loading submissions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-lg text-red-500 mb-4">{error}</Text>
        <TouchableOpacity
          className="px-4 py-2 bg-blue-500 rounded"
          onPress={fetchSubmissions}
        >
          <Text className="text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Text className="text-2xl font-bold p-4 text-gray-800">Submission Queue</Text>
      {submissions.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg text-gray-500">No submissions to review</Text>
        </View>
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
    </View>
  );
}