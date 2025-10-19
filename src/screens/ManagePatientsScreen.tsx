import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { apiService } from '../services/api';
import { AssignPhysioData, CreatePatientData, Exercise, Patient, Physio, PrescribeExerciseData, UpdatePatientData } from '../types';

export default function ManagePatientsScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [physios, setPhysios] = useState<Physio[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'assign' | 'prescribe' | 'edit'>('create');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreatePatientData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
  });
  const [assignForm, setAssignForm] = useState<AssignPhysioData>({ physioId: '' });
  const [prescribeForm, setPrescribeForm] = useState<PrescribeExerciseData>({
    exerciseId: '',
    notes: '',
  });
  const [editForm, setEditForm] = useState<UpdatePatientData>({
    name: '',
    email: '',
    password: '',
  });

  const fetchPatients = useCallback(async () => {
    try {
      setFetchLoading(true);
      const fetchedPatients = await apiService.getPatients();
      setPatients(fetchedPatients);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch patients');
      console.error('Error fetching patients:', error);
    } finally {
      setFetchLoading(false);
    }
  }, []);

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const openModal = (type: 'create' | 'assign' | 'prescribe' | 'edit', patient?: Patient) => {
    setModalType(type);
    if (patient) {
      setSelectedPatient(patient);
      if (type === 'edit') {
        setEditForm({
          name: patient.user.name,
          email: patient.user.email,
          password: '',
        });
      }
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPatient(null);
    // Reset forms
    setCreateForm({ name: '', email: '', password: '', phone: '', dateOfBirth: '' });
    setAssignForm({ physioId: '' });
    setPrescribeForm({ exerciseId: '', notes: '' });
    setEditForm({ name: '', email: '', password: '' });
  };

  const handleCreatePatient = async () => {
    if (!createForm.name || !createForm.email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    try {
      setLoading(true);
      await apiService.createPatient(createForm);
      fetchPatients();

      Alert.alert('Success', 'Patient created successfully');
      closeModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to create patient');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPhysio = async () => {
    if (!selectedPatient || !assignForm.physioId) {
      Alert.alert('Error', 'Please select a physio');
      return;
    }

    try {
      setLoading(true);
      await apiService.assignPhysioToPatient(selectedPatient.id, assignForm);
      Alert.alert('Success', 'Physio assigned successfully');
      closeModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to assign physio');
    } finally {
      setLoading(false);
    }
  };

  const handlePrescribeExercise = async () => {
    if (!selectedPatient || !prescribeForm.exerciseId) {
      Alert.alert('Error', 'Please select an exercise');
      return;
    }

    try {
      setLoading(true);
      await apiService.prescribeExerciseToPatient(selectedPatient.id, prescribeForm);
      Alert.alert('Success', 'Exercise prescribed successfully');
      closeModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to prescribe exercise');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPatient = async () => {
    if (!selectedPatient) {
      Alert.alert('Error', 'No patient selected');
      return;
    }

    try {
      setLoading(true);

      if (editForm.password?.length === 0) {
        delete editForm.password;
      }

      await apiService.updatePatient(selectedPatient.userId, editForm);
      // Update the patient in the local state
      fetchPatients();
      Alert.alert('Success', 'Patient updated successfully');
      closeModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to update patient');
    } finally {
      setLoading(false);
    }
  };

  const renderModal = () => (
    <Modal visible={modalVisible} animationType="slide" transparent>
      <ThemedView className="flex-1 justify-center items-center bg-black bg-opacity-50">
        <ThemedView className="bg-white dark:bg-gray-800 p-6 rounded-lg w-11/12 max-w-md">
          <ThemedText type="subtitle" className="mb-4">
            {modalType === 'create' && 'Create New Patient'}
            {modalType === 'assign' && 'Assign Physio to Patient'}
            {modalType === 'prescribe' && 'Prescribe Exercise'}
            {modalType === 'edit' && 'Edit Patient'}
          </ThemedText>

          {modalType === 'create' && (
            <>
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-3 text-black dark:text-white"
                placeholder="Name"
                value={createForm.name}
                onChangeText={(text) => setCreateForm(prev => ({ ...prev, name: text }))}
              />
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-3 text-black dark:text-white"
                placeholder="Email"
                value={createForm.email}
                onChangeText={(text) => setCreateForm(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
              />
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-3 text-black dark:text-white"
                placeholder="Password"
                value={createForm.password}
                onChangeText={(text) => setCreateForm(prev => ({ ...prev, password: text }))}
                secureTextEntry
              />
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-3 text-black dark:text-white"
                placeholder="Phone (optional)"
                value={createForm.phone}
                onChangeText={(text) => setCreateForm(prev => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
              />
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-4 text-black dark:text-white"
                placeholder="Date of Birth (YYYY-MM-DD)"
                value={createForm.dateOfBirth}
                onChangeText={(text) => setCreateForm(prev => ({ ...prev, dateOfBirth: text }))}
              />
            </>
          )}

          {modalType === 'assign' && (
            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-4 text-black dark:text-white"
              placeholder="Physio ID"
              value={assignForm.physioId}
              onChangeText={(text) => setAssignForm({ physioId: text })}
            />
          )}

          {modalType === 'prescribe' && (
            <>
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-3 text-black dark:text-white"
                placeholder="Exercise ID"
                value={prescribeForm.exerciseId}
                onChangeText={(text) => setPrescribeForm(prev => ({ ...prev, exerciseId: text }))}
              />
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-4 text-black dark:text-white"
                placeholder="Notes (optional)"
                value={prescribeForm.notes}
                onChangeText={(text) => setPrescribeForm(prev => ({ ...prev, notes: text }))}
                multiline
              />
            </>
          )}

          {modalType === 'edit' && (
            <>
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-3 text-black dark:text-white"
                placeholder="Name"
                value={editForm.name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
              />
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-3 text-black dark:text-white"
                placeholder="Email"
                value={editForm.email}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
              />
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-4 text-black dark:text-white"
                placeholder="New Password (leave empty to keep current)"
                value={editForm.password}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, password: text }))}
                secureTextEntry
              />
            </>
          )}

          <ThemedView className="flex-row justify-between">
            <TouchableOpacity
              className="bg-gray-300 dark:bg-gray-600 px-4 py-2 rounded"
              onPress={closeModal}
            >
              <ThemedText>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-blue-500 px-4 py-2 rounded"
              onPress={
                modalType === 'create' ? handleCreatePatient :
                modalType === 'assign' ? handleAssignPhysio :
                modalType === 'prescribe' ? handlePrescribeExercise :
                handleEditPatient
              }
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <ThemedText className="text-white">
                  {modalType === 'create' && 'Create'}
                  {modalType === 'assign' && 'Assign'}
                  {modalType === 'prescribe' && 'Prescribe'}
                  {modalType === 'edit' && 'Update'}
                </ThemedText>
              )}
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </Modal>
  );

  return (
    <ScrollView className="flex-1">
      <ThemedView className="p-6">
        <ThemedText type="title" className="mb-6">Manage Patients</ThemedText>

        <TouchableOpacity
          className="bg-blue-500 p-4 rounded-lg mb-6"
          onPress={() => openModal('create')}
        >
          <ThemedText className="text-white text-center font-bold">Create New Patient</ThemedText>
        </TouchableOpacity>

        <ThemedText type="subtitle" className="mb-4">Patient Actions</ThemedText>

        {fetchLoading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : patients.length === 0 ? (
          <ThemedText className="text-center text-gray-500">No patients found</ThemedText>
        ) : (
          patients.map((patient) => (
            <ThemedView key={patient.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 shadow">
              <ThemedText type="defaultSemiBold" className="mb-2">{patient.user.name}</ThemedText>
              <ThemedText className="mb-3">{patient.user.email}</ThemedText>

              <ThemedView className="flex-row space-x-2 mb-2">
                <TouchableOpacity
                  className="bg-blue-500 px-3 py-2 rounded flex-1"
                  onPress={() => openModal('edit', patient)}
                >
                  <ThemedText className="text-white text-center text-sm">Edit</ThemedText>
                </TouchableOpacity>
              </ThemedView>
              <ThemedView className="flex-row space-x-2">
                <TouchableOpacity
                  className="bg-green-500 px-3 py-2 rounded flex-1"
                  onPress={() => openModal('assign', patient)}
                >
                  <ThemedText className="text-white text-center text-sm">Assign Physio</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-purple-500 px-3 py-2 rounded flex-1"
                  onPress={() => openModal('prescribe', patient)}
                >
                  <ThemedText className="text-white text-center text-sm">Prescribe Exercise</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          ))
        )}

        {renderModal()}
      </ThemedView>
    </ScrollView>
  );
}