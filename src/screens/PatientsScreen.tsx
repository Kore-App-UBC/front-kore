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
      className="bg-transparent p-4 mb-2 mx-4 rounded-lg shadow-sm border border-gray-200 min-w-[50vw]"
      onPress={() => openPrescriptionModal(item)}
    >
      <ThemedText className="text-lg font-semibold">{item.user.name}</ThemedText>
      <ThemedText className="text-gray-600">{item.user.email}</ThemedText>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText className="text-lg">Loading patients...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText className="text-lg text-red-500 mb-4">{error}</ThemedText>
        <TouchableOpacity
          className="px-4 py-2 bg-blue-500 rounded"
          onPress={fetchPatients}
        >
          <ThemedText className="text-white">Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const renderPrescriptionModal = () => (
    <Modal visible={prescriptionModalVisible} animationType="slide" transparent>
      <ThemedView className="flex-1 justify-center items-center bg-black bg-opacity-50">
        <ScrollView className="flex-1 p-6 w-full flex flex-col items-center">
          <ThemedView className="w-11/12 max-w-md max-h-4/5 bg-white dark:bg-gray-800 rounded-lg">
            <ThemedText type="subtitle" className="mb-4">
              Manage Prescriptions - {selectedPatient?.user.name}
            </ThemedText>

            {prescriptionLoading ? (
              <ActivityIndicator size="large" color="#007bff" />
            ) : (
              <>
                <ThemedText className="mb-2 font-semibold">Available Exercises</ThemedText>
                {exercises.map((exercise) => (
                  <ThemedView key={exercise.id} className="p-3 mb-3 bg-gray-100 dark:bg-gray-700 rounded">
                    <ThemedView className="flex-row justify-between items-start mb-2">
                      <ThemedView className="flex-1 mr-3">
                        <ThemedText className="font-semibold">{exercise.name}</ThemedText>
                        <ThemedText className="text-sm text-gray-600 mb-2">{exercise.description}</ThemedText>
                        <TouchableOpacity
                          className={`px-3 py-1 rounded self-start ${exercise.isPrescribed ? 'bg-red-500' : 'bg-green-500'}`}
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
                  <ThemedText className="text-gray-500">No exercises prescribed yet</ThemedText>
                ) : (
                  prescribedExercises.map((prescription) => (
                    <ThemedView key={prescription.id} className="p-3 mb-2 bg-blue-50 dark:bg-blue-900 rounded">
                      <ThemedText className="font-semibold">{prescription.exercise.name}</ThemedText>
                      <ThemedText className="text-sm text-gray-600">{prescription.exercise.description}</ThemedText>
                      <ThemedText className="text-xs text-gray-500">
                        Prescribed: {new Date(prescription.prescribedAt).toLocaleDateString()}
                      </ThemedText>
                    </ThemedView>
                  ))
                )}
              </>
            )}

            <TouchableOpacity
              className="bg-gray-300 dark:bg-gray-600 px-4 py-2 rounded mt-4"
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
    <ThemedView className="flex-1">
      <ThemedText type="title" className="p-4">My Patients</ThemedText>
      {patients.length === 0 ? (
        <ThemedView className="flex-1 justify-center items-center">
          <ThemedText className="text-lg">No patients assigned</ThemedText>
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