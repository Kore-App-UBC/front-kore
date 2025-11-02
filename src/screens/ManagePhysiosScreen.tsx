import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { apiService } from '../services/api';
import { CreatePhysioData, Physio, UpdatePhysioData } from '../types';
import { getAlertState, hideAlert, registerAlertSetter, showAlert } from '../utils/alert';

export default function ManagePhysiosScreen() {
  const [physios, setPhysios] = useState<Physio[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedPhysio, setSelectedPhysio] = useState<Physio | null>(null);
  const [createForm, setCreateForm] = useState<CreatePhysioData>({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [editForm, setEditForm] = useState<UpdatePhysioData>({
    name: '',
    email: '',
    password: '',
  });
  const [alertState, setAlertState] = useState(getAlertState());

  useEffect(() => {
    registerAlertSetter(setAlertState);
  }, []);

  const fetchPhysios = useCallback(async () => {
    try {
      setFetchLoading(true);
      const fetchedPhysios = await apiService.getPhysios();
      setPhysios(fetchedPhysios);
    } catch (error) {
      showAlert('Error', 'Failed to fetch physiotherapists');
      console.error('Error fetching physiotherapists:', error);
    } finally {
      setFetchLoading(false);
    }
  }, []);

  // Fetch physios on component mount
  useEffect(() => {
    fetchPhysios();
  }, [fetchPhysios]);

  const openModal = (type: 'create' | 'edit', physio?: Physio) => {
    setModalType(type);
    if (physio) {
      setSelectedPhysio(physio);
      if (type === 'edit') {
        setEditForm({
          name: physio.user.name,
          email: physio.user.email,
          password: '',
        });
      }
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPhysio(null);
    // Reset forms
    setCreateForm({ name: '', email: '', password: '', phone: '' });
    setEditForm({ name: '', email: '', password: '' });
  };

  const handleCreatePhysio = async () => {
    if (!createForm.name || !createForm.email) {
      showAlert('Error', 'Name and email are required');
      return;
    }

    try {
      setLoading(true);
      await apiService.createPhysio(createForm);
      
      fetchPhysios();
      showAlert('Success', 'Physiotherapist created successfully');
      closeModal();
    } catch (error) {
      showAlert('Error', 'Failed to create physiotherapist');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPhysio = async () => {
    if (!selectedPhysio) {
      showAlert('Error', 'No physiotherapist selected');
      return;
    }

    try {
      setLoading(true);

      if (editForm.password?.length === 0) {
        delete editForm.password;
      }

      await apiService.updatePhysio(selectedPhysio.userId, editForm);
      // Update the physio in the local state
      fetchPhysios();
      showAlert('Success', 'Physiotherapist updated successfully');
      closeModal();
    } catch (error) {
      showAlert('Error', 'Failed to update physiotherapist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 pb-32">
      <ThemedView variant="transparent" className="p-6">
        <ThemedText type="title" className="mb-6">Manage Physiotherapists</ThemedText>

        <TouchableOpacity
          className="bg-accent p-4 rounded-3xl mb-6"
          onPress={() => openModal('create')}
        >
          <ThemedText className="text-white text-center font-bold">Create New Physiotherapist</ThemedText>
        </TouchableOpacity>

        <ThemedText type="subtitle" className="mb-4">Physiotherapists</ThemedText>

        {fetchLoading ? (
          <ActivityIndicator size="large" color="#7F5AF0" />
        ) : physios.length === 0 ? (
          <ThemedText className="text-center text-muted">No physiotherapists found</ThemedText>
        ) : (
          physios.map((physio) => (
            <ThemedView key={physio.id} variant="surface" className="p-5 rounded-3xl mb-4">
              <ThemedText type="defaultSemiBold" className="mb-2">{physio.user.name}</ThemedText>
              <ThemedText className="mb-3">{physio.user.email}</ThemedText>

              <TouchableOpacity
                className="bg-accent px-3 py-3 rounded-2xl flex-1"
                onPress={() => openModal('edit', physio)}
              >
                <ThemedText className="text-white text-center text-sm">Edit</ThemedText>
              </TouchableOpacity>
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

  function renderModal() {
    return (
      <Modal visible={modalVisible} animationType="slide" transparent>
        <ThemedView className="flex-1 justify-center items-center bg-black bg-opacity-50" variant='surface'>
          <ThemedView variant="background" className="p-6 rounded-3xl w-11/12 max-w-md">
            <ThemedText type="subtitle" className="mb-4">
              {modalType === 'create' && 'Create New Physiotherapist'}
              {modalType === 'edit' && 'Edit Physiotherapist'}
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
                  className="rounded-2xl border border-outline px-4 py-3 mb-4 text-white bg-surface"
                  placeholder="Phone (optional)"
                  placeholderTextColor="#7A86A8"
                  value={createForm.phone}
                  onChangeText={(text) => setCreateForm(prev => ({ ...prev, phone: text }))}
                  keyboardType="phone-pad"
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

            <ThemedView className="flex-row justify-between gap-3">
              <TouchableOpacity
                className="px-4 py-3 rounded-2xl border border-outline bg-surface"
                onPress={closeModal}
              >
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-accent px-4 py-3 rounded-2xl"
                onPress={
                  modalType === 'create' ? handleCreatePhysio :
                  handleEditPhysio
                }
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <ThemedText className="text-white">
                    {modalType === 'create' && 'Create'}
                    {modalType === 'edit' && 'Update'}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Modal>
    );
  }
}