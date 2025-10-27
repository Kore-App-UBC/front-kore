import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { apiService } from '../services/api';
import { CreateExerciseData, Exercise, UpdateExerciseData } from '../types';
import { getAlertState, registerAlertSetter, showAlert } from '../utils/alert';

type FormData = CreateExerciseData | UpdateExerciseData;

export default function ManageExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'update'>('create');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [alertState, setAlertState] = useState(getAlertState());

  useEffect(() => {
    registerAlertSetter(setAlertState);
  }, []);

  // Form states
  const [createForm, setCreateForm] = useState<CreateExerciseData>({
    name: '',
    description: '',
    instructionsUrl: '',
    classificationData: {
      thresholds: { up: 0, down: 0 },
      landmarks: [],
      evaluationType: 'low_to_high',
    },
    animationData: {
      basePoints: {},
      animation: '',
    },
  });

  const [updateForm, setUpdateForm] = useState<UpdateExerciseData>({
    name: '',
    description: '',
    instructionsUrl: '',
    classificationData: {
      thresholds: { up: 0, down: 0 },
      landmarks: [],
      evaluationType: 'low_to_high',
    },
    animationData: {
      basePoints: {},
      animation: '',
    },
  });

  const fetchExercises = useCallback(async () => {
    try {
      setFetchLoading(true);
      const fetchedExercises = await apiService.getExercises();
      setExercises(fetchedExercises);
    } catch (error) {
      showAlert('Error', 'Failed to fetch exercises');
      console.error('Error fetching exercises:', error);
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const openModal = (type: 'create' | 'update', exercise?: Exercise) => {
    setModalType(type);
    if (exercise) {
      setSelectedExercise(exercise);
      if (type === 'update') {
        setUpdateForm({
          name: exercise.name,
          description: exercise.description,
          instructionsUrl: exercise.instructionsUrl,
          classificationData: exercise.classificationData,
          animationData: exercise.animationData,
        });
      }
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedExercise(null);
    // Reset forms
    setCreateForm({
      name: '',
      description: '',
      instructionsUrl: '',
      classificationData: {
        thresholds: { up: 0, down: 0 },
        landmarks: [],
        evaluationType: 'low_to_high',
      },
      animationData: {
        basePoints: {},
        animation: '',
      },
    });
    setUpdateForm({
      name: '',
      description: '',
      instructionsUrl: '',
      classificationData: {
        thresholds: { up: 0, down: 0 },
        landmarks: [],
        evaluationType: 'low_to_high',
      },
      animationData: {
        basePoints: {},
        animation: '',
      },
    });
  };

  const handleCreateExercise = async () => {
    if (!createForm.name || !createForm.description || !createForm.instructionsUrl) {
      showAlert('Error', 'Name, description, and instructions URL are required');
      return;
    }

    try {
      setLoading(true);
      await apiService.createExercise(createForm);
      fetchExercises();
      showAlert('Success', 'Exercise created successfully');
      closeModal();
    } catch (error) {
      showAlert('Error', 'Failed to create exercise');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExercise = async () => {
    if (!selectedExercise) {
      showAlert('Error', 'No exercise selected');
      return;
    }

    try {
      setLoading(true);
      await apiService.updateExercise(selectedExercise.id, updateForm);
      fetchExercises();
      showAlert('Success', 'Exercise updated successfully');
      closeModal();
    } catch (error) {
      showAlert('Error', 'Failed to update exercise');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExercise = async (exercise: Exercise) => {
    showAlert(
      'Delete Exercise',
      `Are you sure you want to delete "${exercise.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteExercise(exercise.id);
              fetchExercises();
              showAlert('Success', 'Exercise deleted successfully');
            } catch (error) {
              showAlert('Error', 'Failed to delete exercise');
            }
          },
        },
      ]
    );
  };

  const renderModal = () => {
    const isCreate = modalType === 'create';
    const form = isCreate ? createForm : updateForm;
    const setForm = (isCreate ? setCreateForm : setUpdateForm) as React.Dispatch<React.SetStateAction<FormData>>;

    return (
      <Modal visible={modalVisible} animationType="slide" transparent>
        <ThemedView className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <ScrollView className="w-11/12 max-w-md max-h-4/5">
            <ThemedView className="bg-white dark:bg-gray-800 p-6 rounded-lg">
              <ThemedText type="subtitle" className="mb-4">
                {isCreate ? 'Create New Exercise' : 'Update Exercise'}
              </ThemedText>

              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-3 text-black dark:text-white"
                placeholder="Exercise Name"
                value={form.name}
                onChangeText={(text) => setForm((prev: FormData) => ({ ...prev, name: text }))}
              />

              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-3 text-black dark:text-white"
                placeholder="Description"
                value={form.description}
                onChangeText={(text) => setForm((prev: FormData) => ({ ...prev, description: text }))}
                multiline
              />

              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-3 text-black dark:text-white"
                placeholder="Instructions URL"
                value={form.instructionsUrl}
                onChangeText={(text) => setForm((prev: FormData) => ({ ...prev, instructionsUrl: text }))}
                keyboardType="url"
              />

              <ThemedText className="mb-2 font-semibold">Classification Data (Optional)</ThemedText>

              <ThemedView className="mb-3">
                <ThemedText className="mb-1 text-sm">Thresholds</ThemedText>
                <ThemedView className="flex-row space-x-2">
                  <TextInput
                    className="border border-gray-300 dark:border-gray-600 rounded p-2 flex-1 text-black dark:text-white"
                    placeholder="Up"
                    value={form.classificationData?.thresholds.up?.toString() || ''}
                    onChangeText={(text) => setForm((prev: FormData) => ({
                      ...prev,
                      classificationData: {
                        thresholds: {
                          up: parseFloat(text) || 0,
                          down: prev.classificationData?.thresholds?.down || 0
                        },
                        landmarks: prev.classificationData?.landmarks || [],
                        evaluationType: prev.classificationData?.evaluationType || 'low_to_high'
                      }
                    }))}
                    keyboardType="numeric"
                  />
                  <TextInput
                    className="border border-gray-300 dark:border-gray-600 rounded p-2 flex-1 text-black dark:text-white"
                    placeholder="Down"
                    value={form.classificationData?.thresholds.down?.toString() || ''}
                    onChangeText={(text) => setForm((prev: FormData) => ({
                      ...prev,
                      classificationData: {
                        thresholds: {
                          up: prev.classificationData?.thresholds?.up || 0,
                          down: parseFloat(text) || 0
                        },
                        landmarks: prev.classificationData?.landmarks || [],
                        evaluationType: prev.classificationData?.evaluationType || 'low_to_high'
                      }
                    }))}
                    keyboardType="numeric"
                  />
                </ThemedView>
              </ThemedView>

              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-3 text-black dark:text-white"
                placeholder="Landmarks (comma-separated)"
                value={form.classificationData?.landmarks?.join(', ') || ''}
                onChangeText={(text) => setForm((prev: FormData) => ({
                  ...prev,
                  classificationData: {
                    thresholds: prev.classificationData?.thresholds || { up: 0, down: 0 },
                    landmarks: text.split(',').map(s => s.trim()).filter(s => s),
                    evaluationType: prev.classificationData?.evaluationType || 'low_to_high'
                  }
                }))}
              />

              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-3 text-black dark:text-white"
                placeholder="Evaluation Type (high_to_low, low_to_high, custom)"
                value={form.classificationData?.evaluationType || ''}
                onChangeText={(text) => setForm((prev: FormData) => ({
                  ...prev,
                  classificationData: {
                    thresholds: prev.classificationData?.thresholds || { up: 0, down: 0 },
                    landmarks: prev.classificationData?.landmarks || [],
                    evaluationType: text as 'high_to_low' | 'low_to_high' | 'custom'
                  }
                }))}
              />

              <ThemedText className="mb-2 font-semibold">Animation Data (Optional)</ThemedText>

              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-3 text-black dark:text-white"
                placeholder="Animation Type"
                value={form.animationData?.animation || ''}
                onChangeText={(text) => setForm((prev: FormData) => ({
                  ...prev,
                  animationData: {
                    basePoints: prev.animationData?.basePoints || {},
                    animation: text
                  }
                }))}
              />

              <ThemedView className="flex-row justify-between z-[-1]">
                <TouchableOpacity
                  className="bg-gray-300 dark:bg-gray-600 px-4 py-2 rounded"
                  onPress={closeModal}
                >
                  <ThemedText>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-blue-500 px-4 py-2 rounded"
                  onPress={isCreate ? handleCreateExercise : handleUpdateExercise}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <ThemedText className="text-white">
                      {isCreate ? 'Create' : 'Update'}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ScrollView>
        </ThemedView>
      </Modal>
    );
  };

  return (
    <ScrollView className="flex-1">
      <ThemedView className="p-6">
        <ThemedText type="title" className="mb-6">Manage Exercises</ThemedText>

        <TouchableOpacity
          className="bg-blue-500 p-4 rounded-lg mb-6"
          onPress={() => openModal('create')}
        >
          <ThemedText className="text-white text-center font-bold">Create New Exercise</ThemedText>
        </TouchableOpacity>

        <ThemedText type="subtitle" className="mb-4">Exercises</ThemedText>

        {fetchLoading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : exercises.length === 0 ? (
          <ThemedText className="text-center text-gray-500">No exercises found</ThemedText>
        ) : (
          exercises.map((exercise) => (
            <ThemedView key={exercise.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 shadow">
              <ThemedText type="defaultSemiBold" className="mb-2">{exercise.name}</ThemedText>
              <ThemedText className="mb-2">{exercise.description}</ThemedText>
              <ThemedText className="mb-2 text-sm text-blue-600">{exercise.instructionsUrl}</ThemedText>

              {exercise.classificationData && (
                <ThemedView className="mb-2">
                  <ThemedText className="text-sm font-semibold">Classification:</ThemedText>
                  <ThemedText className="text-sm">Thresholds: {exercise.classificationData.thresholds.up}° / {exercise.classificationData.thresholds.down}°</ThemedText>
                  <ThemedText className="text-sm">Type: {exercise.classificationData.evaluationType}</ThemedText>
                </ThemedView>
              )}

              {exercise.animationData && (
                <ThemedView className="mb-2">
                  <ThemedText className="text-sm font-semibold">Animation:</ThemedText>
                  <ThemedText className="text-sm">Type: {exercise.animationData.animation}</ThemedText>
                </ThemedView>
              )}

              <ThemedView className="flex-row space-x-2">
                <TouchableOpacity
                  className="bg-blue-500 px-3 py-2 rounded flex-1"
                  onPress={() => openModal('update', exercise)}
                >
                  <ThemedText className="text-white text-center text-sm">Edit</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-red-500 px-3 py-2 rounded flex-1"
                  onPress={() => handleDeleteExercise(exercise)}
                >
                  <ThemedText className="text-white text-center text-sm">Delete</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          ))
        )}

        {renderModal()}

        <CustomAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          buttons={alertState.buttons}
          onDismiss={() => setAlertState(prev => ({ ...prev, visible: false }))}
        />
      </ThemedView>
    </ScrollView>
  );
}