import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { apiService } from '../services/api';
import { CreateExerciseData, Exercise, UpdateExerciseData } from '../types';
import { getAlertState, hideAlert, registerAlertSetter, showAlert } from '../utils/alert';

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
      keyframes: [],
      animationType: 'oscillating',
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
      keyframes: [],
      animationType: 'oscillating',
    },
  });

  const fetchExercises = useCallback(async () => {
    try {
      setFetchLoading(true);
      const fetchedExercises = await apiService.getExercises();
      setExercises(fetchedExercises);
    } catch (error) {
      showAlert('Erro', 'Falha ao buscar exercícios');
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
        keyframes: [],
        animationType: 'oscillating',
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
        keyframes: [],
        animationType: 'oscillating',
      },
    });
  };

  const handleCreateExercise = async () => {
    if (!createForm.name || !createForm.description || !createForm.instructionsUrl) {
      showAlert('Erro', 'Nome, descrição e URL das instruções são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      await apiService.createExercise(createForm);
      fetchExercises();
      showAlert('Sucesso', 'Exercício criado com sucesso');
      closeModal();
    } catch (error) {
      showAlert('Erro', 'Falha ao criar exercício');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExercise = async () => {
    if (!selectedExercise) {
      showAlert('Erro', 'Nenhum exercício selecionado');
      return;
    }

    try {
      setLoading(true);
      await apiService.updateExercise(selectedExercise.id, updateForm);
      fetchExercises();
      showAlert('Sucesso', 'Exercício atualizado com sucesso');
      closeModal();
    } catch (error) {
      showAlert('Erro', 'Falha ao atualizar exercício');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExercise = async (exercise: Exercise) => {
    showAlert(
      'Excluir exercício',
      `Tem certeza que deseja excluir "${exercise.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteExercise(exercise.id);
              fetchExercises();
              showAlert('Sucesso', 'Exercício excluído com sucesso');
            } catch (error) {
              showAlert('Erro', 'Falha ao excluir exercício');
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
        <ThemedView className="flex flex-col flex-1 justify-center items-center bg-black bg-opacity-50" variant='surface'>
          <ScrollView className="!max-w-1/2 max-h-4/5 pt-10">
            <ThemedView variant="background" className="p-6 rounded-3xl w-full">
              <ThemedText type="subtitle" className="mb-4">
                {isCreate ? 'Criar novo exercício' : 'Atualizar exercício'}
              </ThemedText>

              <TextInput
                className="rounded-2xl border border-outline px-4 py-3 mb-3 text-white bg-surface"
                placeholder="Nome do exercício"
                placeholderTextColor="#7A86A8"
                value={form.name}
                onChangeText={(text) => setForm((prev: FormData) => ({ ...prev, name: text }))}
              />

              <TextInput
                className="rounded-2xl border border-outline px-4 py-3 mb-3 text-white bg-surface"
                placeholder="Descrição"
                placeholderTextColor="#7A86A8"
                value={form.description}
                onChangeText={(text) => setForm((prev: FormData) => ({ ...prev, description: text }))}
                multiline
              />

              <TextInput
                className="rounded-2xl border border-outline px-4 py-3 mb-3 text-white bg-surface"
                placeholder="URL das instruções"
                placeholderTextColor="#7A86A8"
                value={form.instructionsUrl}
                onChangeText={(text) => setForm((prev: FormData) => ({ ...prev, instructionsUrl: text }))}
                keyboardType="url"
              />

              <ThemedText className="mb-2 font-semibold">Dados de classificação (Opcional)</ThemedText>

              <ThemedView className="mb-3">
                <ThemedText className="mb-1 text-sm text-muted">Limiares</ThemedText>
                <ThemedView className="flex-row gap-3">
                  <TextInput
                    className="rounded-2xl border border-outline px-3 py-3 flex-1 text-white bg-surface"
                    placeholder="Acima"
                    placeholderTextColor="#7A86A8"
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
                    className="rounded-2xl border border-outline px-3 py-3 flex-1 text-white bg-surface"
                    placeholder="Abaixo"
                    placeholderTextColor="#7A86A8"
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
                className="rounded-2xl border border-outline px-4 py-3 mb-3 text-white bg-surface"
                placeholder="Pontos de referência (separados por vírgula)"
                placeholderTextColor="#7A86A8"
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
                className="rounded-2xl border border-outline px-4 py-3 mb-3 text-white bg-surface"
                placeholder="Tipo de avaliação (high_to_low, low_to_high, custom)"
                placeholderTextColor="#7A86A8"
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

              <ThemedText className="mb-2 font-semibold">Dados de animação (Opcional)</ThemedText>

              <TextInput
                className="rounded-2xl border border-outline px-4 py-3 mb-4 text-white bg-surface"
                placeholder="Tipo de animação"
                placeholderTextColor="#7A86A8"
                value={form.animationData?.animationType || ''}
                onChangeText={(text) => setForm((prev: FormData) => ({
                  ...prev,
                  animationData: {
                    basePoints: prev.animationData?.basePoints || {},
                    keyframes: prev.animationData?.keyframes || [],
                    animationType: text as 'oscillating' | 'loop' | undefined,
                  }
                }))}
              />

              <ThemedView className="flex-row justify-between gap-3 mt-4">
                <TouchableOpacity
                  className="px-4 py-3 rounded-2xl border border-outline bg-surface"
                  onPress={closeModal}
                >
                  <ThemedText>Cancelar</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-accent px-4 py-3 rounded-2xl"
                  onPress={isCreate ? handleCreateExercise : handleUpdateExercise}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <ThemedText className="text-white">
                      {isCreate ? 'Criar' : 'Atualizar'}
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
    <ScrollView className="flex-1 pb-32">
      <ThemedView variant="transparent" className="p-6">
  <ThemedText type="title" className="mb-6">Gerenciar exercícios</ThemedText>

        <TouchableOpacity
          className="bg-accent p-4 rounded-3xl mb-6"
          onPress={() => openModal('create')}
        >
          <ThemedText className="text-white text-center font-bold">Criar novo exercício</ThemedText>
        </TouchableOpacity>

  <ThemedText type="subtitle" className="mb-4">Exercícios</ThemedText>

        {fetchLoading ? (
          <ActivityIndicator size="large" color="#7F5AF0" />
        ) : exercises.length === 0 ? (
          <ThemedText className="text-center text-muted">Nenhum exercício encontrado</ThemedText>
        ) : (
          exercises.map((exercise) => (
            <ThemedView key={exercise.id} variant="surface" className="p-5 rounded-3xl mb-4">
              <ThemedText type="defaultSemiBold" className="mb-2">{exercise.name}</ThemedText>
              <ThemedText className="mb-2">{exercise.description}</ThemedText>
              {/* <ThemedText className="mb-2 text-sm text-accent-soft">{exercise.instructionsUrl}</ThemedText> */}

              {exercise.classificationData && (
                <ThemedView className="mb-2" variant='transparent'>
                  <ThemedText className="text-sm font-semibold">Classificação:</ThemedText>
                  <ThemedText className="text-sm">Limiares: {exercise.classificationData.thresholds.up}° / {exercise.classificationData.thresholds.down}°</ThemedText>
                  <ThemedText className="text-sm">Tipo: {exercise.classificationData.evaluationType}</ThemedText>
                </ThemedView>
              )}

              {exercise.animationData && (
                <ThemedView className="mb-2" variant='transparent'>
                  <ThemedText className="text-sm font-semibold">Animação:</ThemedText>
                  <ThemedText className="text-sm">Tipo: {exercise.animationData.animationType ?? 'N/A'}</ThemedText>
                </ThemedView>
              )}

              <ThemedView className="flex-row space-x-2" variant='transparent'>
                <TouchableOpacity
                  className="bg-accent px-3 py-3 rounded-2xl flex-1"
                  onPress={() => openModal('update', exercise)}
                >
                  <ThemedText className="text-white text-center text-sm">Editar</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-danger px-3 py-3 rounded-2xl flex-1"
                  onPress={() => handleDeleteExercise(exercise)}
                >
                  <ThemedText className="text-white text-center text-sm">Excluir</ThemedText>
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
          onDismiss={hideAlert}
        />
      </ThemedView>
    </ScrollView>
  );
}