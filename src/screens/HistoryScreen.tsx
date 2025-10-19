import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { apiService } from '../services/api';
import { Submission } from '../types';

export default function HistoryScreen() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissionHistory();
  }, []);

  const fetchSubmissionHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get<Submission[]>('/patient/submissions/history');
      setSubmissions(data);
    } catch (err) {
      setError('Failed to load submission history. Please try again.');
      console.error('Error fetching submission history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderSubmission = ({ item }: { item: Submission }) => (
    <ThemedView className="p-4 m-2 rounded-lg border border-gray-200">
      <ThemedView className="flex-row justify-between items-start mb-2">
        <ThemedText type="subtitle" className="flex-1">Exercise Submission</ThemedText>
        <ThemedText className="text-sm text-gray-600">{formatDate(item.submittedAt)}</ThemedText>
      </ThemedView>
      <ThemedText className="text-sm text-gray-600 mb-1">Exercise ID: {item.exerciseId}</ThemedText>
      {item.score !== undefined && (
        <ThemedText className="text-sm text-green-600 mb-1">Score: {item.score}/100</ThemedText>
      )}
      {item.feedback && (
        <ThemedView className="mt-2">
          <ThemedText type="defaultSemiBold" className="mb-1">Feedback:</ThemedText>
          <ThemedText className="text-sm">{item.feedback}</ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );

  if (loading) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
        <ThemedText className="mt-4">Loading submission history...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView className="flex-1 justify-center items-center p-4">
        <ThemedText className="text-red-500 text-center mb-4">{error}</ThemedText>
        <ThemedText
          type="link"
          onPress={fetchSubmissionHistory}
          className="text-blue-500 underline"
        >
          Try Again
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <ThemedText type="title" className="p-4 text-center">Submission History</ThemedText>
      {submissions.length === 0 ? (
        <ThemedView className="flex-1 justify-center items-center">
          <ThemedText>No submissions yet.</ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={submissions}
          renderItem={renderSubmission}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </ThemedView>
  );
}