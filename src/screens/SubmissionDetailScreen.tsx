import { useNavigation, useRoute } from '@react-navigation/native';
import { Video } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { apiService } from '../services/api';
import { FeedbackData, SubmissionDetail } from '../types';

export default function SubmissionDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { submissionId } = route.params as { submissionId: string };

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSubmissionDetail();
  }, [submissionId]);

  const fetchSubmissionDetail = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSubmissionDetail(submissionId);
      setSubmission(data);
    } catch (err) {
      setError('Failed to load submission details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!score || !feedback) {
      Alert.alert('Error', 'Please provide both score and feedback');
      return;
    }

    const scoreNum = parseInt(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      Alert.alert('Error', 'Score must be a number between 0 and 100');
      return;
    }

    try {
      setSubmitting(true);
      const feedbackData: FeedbackData = {
        score: scoreNum,
        feedback,
      };
      await apiService.submitFeedback(submissionId, feedbackData);
      Alert.alert('Success', 'Feedback submitted successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to submit feedback');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg">Loading...</Text>
      </View>
    );
  }

  if (error || !submission) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg text-red-500">{error || 'Submission not found'}</Text>
        <TouchableOpacity
          className="mt-4 px-4 py-2 bg-blue-500 rounded"
          onPress={fetchSubmissionDetail}
        >
          <Text className="text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-2xl font-bold mb-4">Submission Details</Text>

        <View className="mb-4">
          <Text className="text-lg font-semibold">Patient: {submission.patient.name}</Text>
          <Text className="text-gray-600">{submission.patient.email}</Text>
        </View>

        <View className="mb-4">
          <Text className="text-lg font-semibold">Exercise: {submission.exercise.name}</Text>
          <Text className="text-gray-600">{submission.exercise.description}</Text>
        </View>

        <View className="mb-4">
          <Text className="text-gray-600">Submitted: {new Date(submission.submittedAt).toLocaleString()}</Text>
        </View>

        {submission.mediaUrl && (
          <View className="mb-4">
            <Text className="text-lg font-semibold mb-2">Video Submission</Text>
            <Video
              source={{ uri: submission.mediaUrl }}
              style={{ width: '100%', height: 300 }}
              useNativeControls
              resizeMode="contain"
            />
          </View>
        )}

        <View className="mb-4">
          <Text className="text-lg font-semibold mb-2">Provide Feedback</Text>

          <TextInput
            className="border border-gray-300 rounded p-2 mb-2"
            placeholder="Score (0-100)"
            value={score}
            onChangeText={setScore}
            keyboardType="numeric"
          />

          <TextInput
            className="border border-gray-300 rounded p-2 mb-4 h-24"
            placeholder="Feedback comments"
            value={feedback}
            onChangeText={setFeedback}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            className="bg-blue-500 py-3 rounded"
            onPress={handleSubmitFeedback}
            disabled={submitting}
          >
            <Text className="text-white text-center font-semibold">
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}