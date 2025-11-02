import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import CustomAlert from '../components/CustomAlert';
import Dropdown from '../components/Dropdown';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { apiService } from '../services/api';
import { AssignPhysioData, CreatePatientData, Exercise, Patient, Physio, PhysioDropdownOption, PrescribeExerciseData, UpdatePatientData } from '../types';
import { getAlertState, hideAlert, registerAlertSetter, showAlert } from '../utils/alert';

export default function ManagePatientsScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [physios, setPhysios] = useState<Physio[]>([]);
  const [physioOptions, setPhysioOptions] = useState<PhysioDropdownOption[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'assign' | 'prescribe' | 'edit'>('create');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [alertState, setAlertState] = useState(getAlertState());

  useEffect(() => {
    registerAlertSetter(setAlertState);
  }, []);

  // Form states
  const [createForm, setCreateForm] = useState<CreatePatientData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
  });
  const [assignForm, setAssignForm] = useState<AssignPhysioData>({ physiotherapistId: '' });
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
      showAlert('Error', 'Failed to fetch patients');
      console.error('Error fetching patients:', error);
    } finally {
      setFetchLoading(false);
    }
  }, []);

  const fetchPhysioOptions = useCallback(async () => {
    try {
      const options = await apiService.getPhysioDropdown();
      setPhysioOptions(options);
    } catch (error) {
      showAlert('Error', 'Failed to fetch physiotherapists');
      console.error('Error fetching physio options:', error);
    }
  }, []);

  // Fetch patients and physio options on component mount
  useEffect(() => {
    fetchPatients();
    fetchPhysioOptions();
  }, [fetchPatients, fetchPhysioOptions]);

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
    setAssignForm({ physiotherapistId: '' });
    setPrescribeForm({ exerciseId: '', notes: '' });
    setEditForm({ name: '', email: '', password: '' });
  };

  const handlePhysioSelect = (physioId: string) => {
    setAssignForm({ physiotherapistId: physioId });
  };

  const handleCreatePatient = async () => {
    if (!createForm.name || !createForm.email) {
      showAlert('Error', 'Name and email are required');
      return;
    }

    try {
      setLoading(true);
      await apiService.createPatient(createForm);
      fetchPatients();

      showAlert('Success', 'Patient created successfully');
      closeModal();
    } catch (error) {
      showAlert('Error', 'Failed to create patient');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPhysio = async () => {
    if (!selectedPatient || !assignForm.physiotherapistId) {
      showAlert('Error', 'Please select a physio');
      return;
    }

    try {
      setLoading(true);
      await apiService.assignPhysioToPatient(selectedPatient.id, assignForm);
      showAlert('Success', 'Physio assigned successfully');
      fetchPatients();
      closeModal();
    } catch (error) {
      showAlert('Error', 'Failed to assign physio');
    } finally {
      setLoading(false);
    }
  };

  const handlePrescribeExercise = async () => {
    if (!selectedPatient || !prescribeForm.exerciseId) {
      showAlert('Error', 'Please select an exercise');
      return;
    }

    try {
      setLoading(true);
      await apiService.prescribeExerciseToPatient(selectedPatient.id, prescribeForm);
      showAlert('Success', 'Exercise prescribed successfully');
      closeModal();
    } catch (error) {
      showAlert('Error', 'Failed to prescribe exercise');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPatient = async () => {
    if (!selectedPatient) {
      showAlert('Error', 'No patient selected');
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
      showAlert('Success', 'Patient updated successfully');
      closeModal();
    } catch (error) {
      showAlert('Error', 'Failed to update patient');
    } finally {
      setLoading(false);
    }
  };

  const renderModal = () => (
    <Modal visible={modalVisible} animationType="slide" transparent>
      <ThemedView className="flex-1 justify-center items-center bg-black bg-opacity-50" variant='surfaceStrong'>
        <ThemedView variant="background" className="p-6 rounded-3xl w-11/12 max-w-md bg-black">
          <ThemedText type="subtitle" className="mb-4">
            {modalType === 'create' && 'Create New Patient'}
            {modalType === 'assign' && 'Assign Physio to Patient'}
            {modalType === 'prescribe' && 'Prescribe Exercise'}
            {modalType === 'edit' && 'Edit Patient'}
          </ThemedText>

          {modalType === 'create' && (
            <>
              <TextInput
                className="rounded-2xl border border-outline px-4 py-3 mb-3 text-white bg-surface"
                placeholder="Name"
                placeholderTextColor="#7A86A8"
                value={createForm.name}
                onChangeText={(text) => setCreateForm(prev => ({ ...prev, name: text }))}
              />
              <TextInput
                className="rounded-2xl border border-outline px-4 py-3 mb-3 text-white bg-surface"
                placeholder="Email"
                placeholderTextColor="#7A86A8"
                value={createForm.email}
                onChangeText={(text) => setCreateForm(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
              />
              <TextInput
                className="rounded-2xl border border-outline px-4 py-3 mb-3 text-white bg-surface"
                placeholder="Password"
                placeholderTextColor="#7A86A8"
                value={createForm.password}
                onChangeText={(text) => setCreateForm(prev => ({ ...prev, password: text }))}
                secureTextEntry
              />
              <TextInput
                className="rounded-2xl border border-outline px-4 py-3 mb-3 text-white bg-surface"
                placeholder="Phone (optional)"
                placeholderTextColor="#7A86A8"
                value={createForm.phone}
                onChangeText={(text) => setCreateForm(prev => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
              />
              <TextInput
                className="rounded-2xl border border-outline px-4 py-3 mb-4 text-white bg-surface"
                placeholder="Date of Birth (YYYY-MM-DD)"
                placeholderTextColor="#7A86A8"
                value={createForm.dateOfBirth}
                onChangeText={(text) => setCreateForm(prev => ({ ...prev, dateOfBirth: text }))}
              />
            </>
          )}

          {modalType === 'assign' && (
            <Dropdown
              options={physioOptions}
              selectedValue={assignForm.physiotherapistId}
              onValueChange={handlePhysioSelect}
              placeholder="Select a Physiotherapist"
              className="mb-4"
            />
          )}

          {modalType === 'prescribe' && (
            <>
              <TextInput
                className="rounded-2xl border border-outline px-4 py-3 mb-3 text-white bg-surface"
                placeholder="Exercise ID"
                placeholderTextColor="#7A86A8"
                value={prescribeForm.exerciseId}
                onChangeText={(text) => setPrescribeForm(prev => ({ ...prev, exerciseId: text }))}
              />
              <TextInput
                className="rounded-2xl border border-outline px-4 py-3 mb-4 text-white bg-surface"
                placeholder="Notes (optional)"
                placeholderTextColor="#7A86A8"
                value={prescribeForm.notes}
                onChangeText={(text) => setPrescribeForm(prev => ({ ...prev, notes: text }))}
                multiline
              />
            </>
          )}

          {modalType === 'edit' && (
            <>
              <TextInput
                className="rounded-2xl border border-outline px-4 py-3 mb-3 text-white bg-surface"
                placeholder="Name"
                placeholderTextColor="#7A86A8"
                value={editForm.name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
              />
              <TextInput
                className="rounded-2xl border border-outline px-4 py-3 mb-3 text-white bg-surface"
                placeholder="Email"
                placeholderTextColor="#7A86A8"
                value={editForm.email}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
              />
              <TextInput
                className="rounded-2xl border border-outline px-4 py-3 mb-4 text-white bg-surface"
                placeholder="New Password (leave empty to keep current)"
                placeholderTextColor="#7A86A8"
                value={editForm.password}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, password: text }))}
                secureTextEntry
              />
            </>
          )}

          <ThemedView className="flex-row justify-between gap-3 mt-4 z-[-1]" variant='transparent'>
            <TouchableOpacity
              className="px-4 py-3 rounded-2xl border border-outline bg-surface"
              onPress={closeModal}
            >
              <ThemedText>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-accent px-4 py-3 rounded-2xl"
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
    <ScrollView className="flex-1 pb-32">
      <ThemedView variant="transparent" className="p-6">
        <ThemedText type="title" className="mb-6">Manage Patients</ThemedText>

        <TouchableOpacity
          className="bg-accent p-4 rounded-3xl mb-6"
          onPress={() => openModal('create')}
        >
          <ThemedText className="text-white text-center font-bold">Create New Patient</ThemedText>
        </TouchableOpacity>

        <ThemedText type="subtitle" className="mb-4">Patient Actions</ThemedText>

        {fetchLoading ? (
          <ActivityIndicator size="large" color="#7F5AF0" />
        ) : patients.length === 0 ? (
          <ThemedText className="text-center text-muted">No patients found</ThemedText>
        ) : (
          patients.map((patient) => (
            <ThemedView key={patient.id} variant="surface" className="p-5 rounded-3xl mb-4">
              <ThemedText type="defaultSemiBold" className="mb-2">{patient.user.name}</ThemedText>
              <ThemedText className="mb-3">{patient.user.email}</ThemedText>
              {
                patient.physiotherapist?.user?.name 
                && 
                <ThemedText className="mb-3 italic text-sm text-muted">Responsible Physiotherapist: {patient.physiotherapist?.user?.name}</ThemedText>
              }

              <ThemedView className="flex-row space-x-2 mb-2">
                <TouchableOpacity
                  className="bg-accent px-3 py-3 rounded-2xl flex-1"
                  onPress={() => openModal('edit', patient)}
                >
                  <ThemedText className="text-white text-center text-sm">Edit</ThemedText>
                </TouchableOpacity>
              </ThemedView>
              <ThemedView className="flex-row space-x-2">
                <TouchableOpacity
                  className="bg-success px-3 py-3 rounded-2xl flex-1"
                  onPress={() => openModal('assign', patient)}
                >
                  <ThemedText className="text-white text-center text-sm">Assign Physio</ThemedText>
                </TouchableOpacity>
                {/* <TouchableOpacity
                  className="bg-purple-500 px-3 py-2 rounded flex-1"
                  onPress={() => openModal('prescribe', patient)}
                >
                  <ThemedText className="text-white text-center text-sm">Prescribe Exercise</ThemedText>
                </TouchableOpacity> */}
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