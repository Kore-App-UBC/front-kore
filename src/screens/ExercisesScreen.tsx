import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';
import LogoutButton from '../components/LogoutButton';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { apiService } from '../services/api';
import { Exercise } from '../types';

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get<Exercise[]>('/patient/exercises');
      setExercises(data);
    } catch (err) {
      setError('Failed to load exercises. Please try again.');
      console.error('Error fetching exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderExercise = ({ item }: { item: Exercise }) => (
    <ThemedView className="p-4 m-2 rounded-lg border border-gray-200">
      <ThemedText type="subtitle" className="mb-2">{item.name}</ThemedText>
      <ThemedText className="mb-2">{item.description}</ThemedText>
      <ThemedText className="text-sm text-gray-600">Duration: {item.duration} minutes</ThemedText>
      <ThemedText className="text-sm text-gray-600">Difficulty: {item.difficulty}</ThemedText>
      <ThemedText className="text-sm text-gray-600">Category: {item.category}</ThemedText>
      {item.instructions.length > 0 && (
        <ThemedView className="mt-2">
          <ThemedText type="defaultSemiBold" className="mb-1">Instructions:</ThemedText>
          {item.instructions.map((instruction, index) => (
            <ThemedText key={index} className="text-sm">• {instruction}</ThemedText>
          ))}
        </ThemedView>
      )}
    </ThemedView>
  );

  if (loading) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
        <ThemedText className="mt-4">Loading exercises...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView className="flex-1 justify-center items-center p-4">
        <ThemedText className="text-red-500 text-center mb-4">{error}</ThemedText>
        <ThemedText
          type="link"
          onPress={fetchExercises}
          className="text-blue-500 underline"
        >
          Try Again
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <ThemedText type="title" className="p-4 text-center">My Exercises</ThemedText>
      {exercises.length === 0 ? (
        <ThemedView className="flex-1 justify-center items-center">
          <ThemedText>No exercises assigned yet.</ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={exercises}
          renderItem={renderExercise}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
      <ThemedView className="p-4">
        <LogoutButton onLogout={() => router.replace('/(auth)/login')} />
      </ThemedView>
    </ThemedView>
  );
}