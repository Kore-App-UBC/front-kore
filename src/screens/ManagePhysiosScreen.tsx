import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { apiService } from '../services/api';
import { CreatePhysioData, Physio, UpdatePhysioData } from '../types';

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

  const fetchPhysios = useCallback(async () => {
    try {
      setFetchLoading(true);
      const fetchedPhysios = await apiService.getPhysios();
      setPhysios(fetchedPhysios);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch physiotherapists');
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
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    try {
      setLoading(true);
      const newPhysio = await apiService.createPhysio(createForm);
      setPhysios(prev => [...prev, newPhysio]);
      Alert.alert('Success', 'Physiotherapist created successfully');
      closeModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to create physiotherapist');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPhysio = async () => {
    if (!selectedPhysio) {
      Alert.alert('Error', 'No physiotherapist selected');
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
      Alert.alert('Success', 'Physiotherapist updated successfully');
      closeModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to update physiotherapist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1">
      <ThemedView className="p-6">
        <ThemedText type="title" className="mb-6">Manage Physiotherapists</ThemedText>

        <TouchableOpacity
          className="bg-blue-500 p-4 rounded-lg mb-6"
          onPress={() => openModal('create')}
        >
          <ThemedText className="text-white text-center font-bold">Create New Physiotherapist</ThemedText>
        </TouchableOpacity>

        <ThemedText type="subtitle" className="mb-4">Physiotherapists</ThemedText>

        {fetchLoading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : physios.length === 0 ? (
          <ThemedText className="text-center text-gray-500">No physiotherapists found</ThemedText>
        ) : (
          physios.map((physio) => (
            <ThemedView key={physio.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 shadow">
              <ThemedText type="defaultSemiBold" className="mb-2">{physio.user.name}</ThemedText>
              <ThemedText className="mb-3">{physio.user.email}</ThemedText>

              <TouchableOpacity
                className="bg-blue-500 px-3 py-2 rounded flex-1"
                onPress={() => openModal('edit', physio)}
              >
                <ThemedText className="text-white text-center text-sm">Edit</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ))
        )}

        {renderModal()}
      </ThemedView>
    </ScrollView>
  );

  function renderModal() {
    return (
      <Modal visible={modalVisible} animationType="slide" transparent>
        <ThemedView className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <ThemedView className="bg-white dark:bg-gray-800 p-6 rounded-lg w-11/12 max-w-md">
            <ThemedText type="subtitle" className="mb-4">
              {modalType === 'create' && 'Create New Physiotherapist'}
              {modalType === 'edit' && 'Edit Physiotherapist'}
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
                  className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-4 text-black dark:text-white"
                  placeholder="Phone (optional)"
                  value={createForm.phone}
                  onChangeText={(text) => setCreateForm(prev => ({ ...prev, phone: text }))}
                  keyboardType="phone-pad"
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