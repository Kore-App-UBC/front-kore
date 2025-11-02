import { ResizeMode, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { apiService } from '../services/api';
import { FeedbackData, SubmissionDetail } from '../types';

export default function SubmissionDetailScreen() {
  const { submissionId } = useLocalSearchParams() as { submissionId: string };
  const router = useRouter();

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // score removed - only freeform feedback is required now
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [videoAspect, setVideoAspect] = useState<number | null>(null);
  const [alertState, setAlertState] = useState<{
    title: string;
    message?: string;
    buttons?: {
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }[];
  } | null>(null);

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
    if (!feedback) {
      setAlertState({ title: 'Error', message: 'Please provide feedback' });
      return;
    }

    try {
      setSubmitting(true);
      const feedbackData: FeedbackData = {
        physioFeedback: feedback,
      };
      await apiService.submitFeedback(submissionId, feedbackData);
      setAlertState({
        title: 'Success',
        message: 'Feedback submitted successfully',
        buttons: [
          {
            text: 'OK',
            onPress: () => {
              router.back();
              setAlertState(null);
              setSubmitting(false);
              setFeedback('');
            },
          },
        ],
      });
    } catch (err) {
      setAlertState({ title: 'Error', message: 'Failed to submit feedback' });
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ThemedView variant="transparent" className="flex-1 justify-center items-center">
        <ThemedText className="text-lg">Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (error || !submission) {
    return (
      <ThemedView variant="transparent" className="flex-1 justify-center items-center">
        <ThemedText className="text-lg text-danger">{error || 'Submission not found'}</ThemedText>
        <TouchableOpacity
          className="mt-4 px-5 py-3 bg-accent rounded-2xl"
          onPress={fetchSubmissionDetail}
        >
          <ThemedText className="text-white">Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView variant="transparent">
      <ScrollView className='w-full flex flex-col items-center pb-32'>
        <ThemedView variant="transparent" className="p-6 max-w-[800px] w-full">
          <ThemedText className="text-2xl font-bold mb-4" type='title'>Submission Details</ThemedText>

          <ThemedView variant="surfaceStrong" className="mb-4 p-5 rounded-3xl">
            <ThemedText className="text-lg font-semibold">Patient: {submission.patient.user.name}</ThemedText>
            <ThemedText className="text-muted">{submission.patient.user.email}</ThemedText>
          </ThemedView>

          <ThemedView variant="surfaceStrong" className="mb-4 p-5 rounded-3xl">
            <ThemedText className="text-lg font-semibold">Exercise: {submission.exercise.name}</ThemedText>
            <ThemedText className="text-muted">{submission.exercise.description}</ThemedText>
          </ThemedView>

          <ThemedView variant="surfaceStrong" className="mb-4 p-5 rounded-3xl">
            <ThemedText className="text-muted">Submitted: {new Date(submission.submittedAt).toLocaleString()}</ThemedText>
          </ThemedView>

          {submission.videoUrl && (
            <ThemedView variant="background" className="flex flex-col h-fit mb-4 min-h-[300px] p-5 rounded-3xl">
              <ThemedText className="text-lg font-semibold mb-2">Video Submission</ThemedText>
              {Platform.OS === 'web' ? (
                <video
                  controls
                  src={submission.videoUrl}
                  onLoadedMetadata={(e) => {
                    try {
                      const target = e.currentTarget as HTMLVideoElement;
                      if (target && target.videoWidth && target.videoHeight) {
                        setVideoAspect(target.videoWidth / target.videoHeight);
                      }
                    } catch (err) {
                      console.warn('Failed to read video metadata on web', err);
                    }
                  }}
                  style={{ width: '100%', height: 500, borderRadius: 8 }}
                />
              ) : (
                <Video
                  style={{ width: '100%', aspectRatio: videoAspect ?? (16 / 9), borderRadius: 8 }}
                  source={{ uri: submission.videoUrl }}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  onReadyForDisplay={(event) => {
                    try {
                      const natural = event.naturalSize;
                      if (natural && natural.width && natural.height) {
                        setVideoAspect(natural.width / natural.height);
                      }
                    } catch (e) {
                      // ignore and keep default aspect ratio
                      console.warn('Failed to read video natural size from onReadyForDisplay', e);
                    }
                  }}
                />
              )}
            </ThemedView>
          )}

          <ThemedView variant="background" className="mb-6 p-6 rounded-3xl">
            <ThemedText className="text-lg font-semibold mb-2">Provide Feedback</ThemedText>

            {/* score removed - only feedback comments are collected */}

            <TextInput
              className="rounded-2xl border border-outline px-4 py-3 mb-4 h-24 text-white bg-surface"
              placeholder="Feedback comments"
              placeholderTextColor="#7A86A8"
              value={feedback}
              onChangeText={setFeedback}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              className="bg-accent py-3 rounded-2xl"
              onPress={handleSubmitFeedback}
              disabled={submitting}
            >
              <ThemedText className="text-white text-center font-semibold">
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ScrollView>
      {alertState && (
        <CustomAlert
          visible
          title={alertState.title}
          message={alertState.message}
          buttons={alertState.buttons}
          onDismiss={() => setAlertState(null)}
        />
      )}
    </ThemedView>
  );
}