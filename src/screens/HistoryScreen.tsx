import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { apiService } from '../services/api';
import { Submission } from '../types';

export default function HistoryScreen() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reversedSubmissions = useMemo(() => [...submissions].reverse(), [submissions]);

  useEffect(() => {
    fetchSubmissionHistory();
  }, []);

  const fetchSubmissionHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get<Submission[]>('/patient/submissions/history');
      setSubmissions(data.reverse());
    } catch (err) {
      setError('Falha ao carregar o histórico de envios. Por favor, tente novamente.');
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
    <ThemedView
      className={`p-4 m-2 rounded-lg border border-gray-200`}
      variant='surfaceStrong'
    >
      <ThemedView className="flex-row justify-between items-center mb-2 gap-7 !bg-transparent">
        <ThemedText type="subtitle" className="flex-1">Envio de exercício</ThemedText>
        <ThemedView className="flex-row items-center gap-2 p-3 rounded-md">
          {item.status === 'PROCESSED' && (
            <ThemedView className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100">
              <MaterialIcons name="access-time" size={20} color="#c2410c" />
            </ThemedView>
          )}
          <ThemedText className="text-sm text-gray-600">{formatDate(new Date(item.createdAt))}</ThemedText>
        </ThemedView>
      </ThemedView>
      {item.report?.physioFeedback && (
        <ThemedView className="mt-2 p-3 rounded-md">
          <ThemedText type="defaultSemiBold" className="mb-1">Feedback do fisioterapeuta:</ThemedText>
          <ThemedText className="text-sm">{item.report.physioFeedback}</ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );

  if (loading) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
        <ThemedText className="mt-4">Carregando histórico de envios...</ThemedText>
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
          Tentar novamente
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <ThemedText type="title" className="p-4 text-center">Histórico de envios</ThemedText>
      {submissions.length === 0 ? (
        <ThemedView className="flex-1 justify-center items-center">
          <ThemedText>Nenhum envio ainda.</ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={reversedSubmissions}
          renderItem={renderSubmission}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 128 }}
        />
      )}
    </ThemedView>
  );
}