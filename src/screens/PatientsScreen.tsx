import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import CustomAlert from '../components/CustomAlert';
import ExerciseAnimationPreview from '../components/ExerciseAnimationPreview';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { apiService } from '../services/api';
import { AvailableExercise, Patient, PrescribedExercise } from '../types';
import { getAlertState, registerAlertSetter, showAlert } from '../utils/alert';

export default function PatientsScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Prescription modal states
  const [prescriptionModalVisible, setPrescriptionModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [exercises, setExercises] = useState<AvailableExercise[]>([]);
  const [prescribedExercises, setPrescribedExercises] = useState<PrescribedExercise[]>([]);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [alertState, setAlertState] = useState(getAlertState());

  useEffect(() => {
    fetchPatients();
    registerAlertSetter(setAlertState);
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAssignedPatients();
      setPatients(data);
    } catch (err) {
      setError('Failed to load patients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPatients();
    setRefreshing(false);
  };

  const openPrescriptionModal = async (patient: Patient) => {
    setSelectedPatient(patient);
    setPrescriptionModalVisible(true);
    await fetchExercisesForPatient(patient.id);
  };

  const closePrescriptionModal = () => {
    setPrescriptionModalVisible(false);
    setSelectedPatient(null);
    setExercises([]);
    setPrescribedExercises([]);
  };

  const fetchExercisesForPatient = async (patientId: string) => {
    try {
      setPrescriptionLoading(true);
      const [availableExercises, prescribed] = await Promise.all([
        apiService.getAvailableExercises(patientId),
        apiService.getPrescribedExercises(patientId)
      ]);
      setExercises(availableExercises);
      setPrescribedExercises(prescribed);
    } catch (error) {
      showAlert('Error', 'Failed to load exercises');
      console.error(error);
    } finally {
      setPrescriptionLoading(false);
    }
  };

  const handlePrescribeExercise = async (exerciseId: string) => {
    if (!selectedPatient) return;

    try {
      await apiService.prescribeExercise(selectedPatient.id, exerciseId);
      showAlert('Success', 'Exercise prescribed successfully');
      await fetchExercisesForPatient(selectedPatient.id);
    } catch (error) {
      showAlert('Error', 'Failed to prescribe exercise');
      console.error(error);
    }
  };

  const handleRemovePrescription = async (exerciseId: string) => {
    if (!selectedPatient) return;

    try {
      await apiService.removePrescribedExercise(selectedPatient.id, exerciseId);
      showAlert('Success', 'Prescription removed successfully');
      await fetchExercisesForPatient(selectedPatient.id);
    } catch (error) {
      showAlert('Error', 'Failed to remove prescription');
      console.error(error);
    }
  };

  const renderPatient = ({ item }: { item: Patient }) => (
    <TouchableOpacity
      className="border border-outline bg-surface rounded-3xl px-5 py-4 mb-3 mx-4 min-w-[50vw]"
      onPress={() => openPrescriptionModal(item)}
    >
      <ThemedText className="text-lg font-semibold">{item.user.name}</ThemedText>
      <ThemedText className="text-muted">{item.user.email}</ThemedText>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <ThemedView variant="transparent" className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#7F5AF0" />
        <ThemedText className="text-lg text-muted mt-4">Loading patients...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView variant="transparent" className="flex-1 justify-center items-center">
        <ThemedText className="text-lg text-danger mb-4">{error}</ThemedText>
        <TouchableOpacity
          className="px-5 py-3 bg-accent rounded-2xl"
          onPress={fetchPatients}
        >
          <ThemedText className="text-white">Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const renderPrescriptionModal = () => (
    <Modal visible={prescriptionModalVisible} animationType="slide" transparent>
      <ThemedView className="flex-1 justify-center items-center bg-black bg-opacity-50" variant='surface'>
        <ScrollView className="flex-1 p-6 w-full flex flex-col items-center">
          <ThemedView variant="surfaceStrong" className="w-11/12 max-h-4/5 p-6 rounded-3xl">
            <ThemedText type="subtitle" className="mb-4">
              Manage Prescriptions - {selectedPatient?.user.name}
            </ThemedText>

            {prescriptionLoading ? (
              <ActivityIndicator size="large" color="#7F5AF0" />
            ) : (
              <>
                <ThemedText className="mb-2 font-semibold">Available Exercises</ThemedText>
                {exercises.map((exercise) => (
                  <ThemedView key={exercise.id} variant="surfaceStrong" className="p-3 mb-3 rounded-2xl !bg-transparent">
                    <ThemedView className="flex-row justify-between items-start mb-2 !bg-transparent">
                      <ThemedView className="flex-1 mr-3 !bg-transparent">
                        <ThemedText className="font-semibold">{exercise.name}</ThemedText>
                        <ThemedText className="text-sm text-muted mb-2">{exercise.description}</ThemedText>
                        <TouchableOpacity
                          className={`px-3 py-1 rounded-2xl self-start ${exercise.isPrescribed ? 'bg-danger' : 'bg-success'}`}
                          onPress={() => exercise.isPrescribed
                            ? handleRemovePrescription(exercise.id)
                            : handlePrescribeExercise(exercise.id)
                          }
                        >
                          <ThemedText className="text-white text-sm">
                            {exercise.isPrescribed ? 'Remove' : 'Prescribe'}
                          </ThemedText>
                        </TouchableOpacity>
                      </ThemedView>
                      {exercise.animationData && (
                        <ExerciseAnimationPreview
                          animationData={exercise.animationData}
                          width={160}
                          height={160}
                        />
                      )}
                    </ThemedView>
                  </ThemedView>
                ))}

                <ThemedText className="mb-2 mt-4 font-semibold">Current Prescriptions</ThemedText>
                {prescribedExercises.length === 0 ? (
                  <ThemedText className="text-muted">No exercises prescribed yet</ThemedText>
                ) : (
                  prescribedExercises.map((prescription) => (
                    <ThemedView key={prescription.id} variant="surfaceStrong" className="p-3 mb-2 rounded-2xl">
                      <ThemedText className="font-semibold">{prescription.exercise.name}</ThemedText>
                      <ThemedText className="text-sm text-muted">{prescription.exercise.description}</ThemedText>
                      <ThemedText className="text-xs text-muted">
                        Prescribed: {new Date(prescription.prescribedAt).toLocaleDateString()}
                      </ThemedText>
                    </ThemedView>
                  ))
                )}
              </>
            )}

            <TouchableOpacity
              className="px-4 py-3 rounded-2xl border border-outline bg-surface mt-4"
              onPress={closePrescriptionModal}
            >
              <ThemedText className="text-center">Close</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </Modal>
  );

  return (
    <ThemedView variant="transparent" className="flex-1">
      <ThemedText type="title" className="p-4">My Patients</ThemedText>
      {patients.length === 0 ? (
        <ThemedView variant="transparent" className="flex-1 justify-center items-center">
          <ThemedText className="text-lg text-muted">No patients assigned</ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={patients}
          renderItem={renderPatient}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {renderPrescriptionModal()}

      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onDismiss={() => setAlertState(prev => ({ ...prev, visible: false }))}
      />
    </ThemedView>
  );
}