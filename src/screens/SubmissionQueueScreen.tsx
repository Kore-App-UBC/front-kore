import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { apiService } from '../services/api';
import { SubmissionQueueItem } from '../types';

export default function SubmissionQueueScreen() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<SubmissionQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchSubmissions();
    }
  }, [isFocused]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSubmissionQueue();
      setSubmissions(data);
    } catch (err) {
      setError('Falha ao carregar submissões');
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
    // navigate using expo-router to the physio submission detail route
    try {
      router.push({ pathname: '/(physio)/submission-detail', params: { submissionId } });
    } catch (e) {
      console.error('Navigation error', e);
    }
  };

  const renderSubmission = ({ item }: { item: SubmissionQueueItem }) => (
    <TouchableOpacity
      className="bg-transparent p-3 mb-2 mx-4 rounded-lg shadow-sm border border-gray-200 w-[500px]"
      onPress={() => handleSubmissionPress(item.id)}
    >
      <View className="flex-row items-center">
        {/* Avatar / initials */}
        <View className="w-12 h-12 rounded-full bg-[#0a7ea4] justify-center items-center mr-3">
          <ThemedText className="text-sm font-bold text-white">
            {item.patient.user.name
              ? item.patient.user.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : '--'}
          </ThemedText>
        </View>

        {/* Main info */}
        <View className="flex-1">
          <ThemedText className="text-base font-semibold text-[#0a7ea4]">{item.exercise.name}</ThemedText>
          <ThemedText className="text-sm text-gray-600">{item.patient.user.name}</ThemedText>
          <ThemedText className="text-xs text-gray-400 mt-1">
            {new Date(item.submittedAt).toLocaleString()}
          </ThemedText>
        </View>

        {/* Status + chevron */}
        <View className="items-end ml-3">
          <View
            className={`px-3 py-1 rounded-full ${
              item.status === 'pending' ? 'bg-transparent' : 'bg-transparent'
            }`}
          >
            <ThemedText
              className={`text-xs font-medium ${
                item.status === 'pending' ? 'text-amber-800' : 'text-[#0a7ea4]'
              }`}
            >
              {item.status === 'pending'
                ? 'Pendente'
                : item.status === 'reviewed'
                ? 'Revisado'
                : item.status === 'approved'
                ? 'Aprovado'
                : item.status === 'rejected'
                ? 'Rejeitado'
                : item.status}
            </ThemedText>
          </View>

          <ThemedText className="text-gray-300 text-xl mt-2">›</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
  <ThemedText className="text-lg">Carregando submissões...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText className="text-lg text-red-500 mb-4">{error}</ThemedText>
        <TouchableOpacity
            className="px-4 py-2 bg-[#0a7ea4] rounded"
          onPress={fetchSubmissions}
        >
          <ThemedText className="text-white">Tentar novamente</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <ScrollView className='flex flex-col items-center w-full pb-32'>
  <ThemedText type="title" className="p-4">Fila de submissões</ThemedText>
        {submissions.length === 0 ? (
            <ThemedView className="flex-1 justify-center items-center">
            <ThemedText className="text-lg">Nenhuma submissão para revisar</ThemedText>
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
      </ScrollView>
    </ThemedView>
  );
}