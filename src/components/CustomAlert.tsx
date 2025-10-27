import React from 'react';
import { Modal, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

export default function CustomAlert({
  visible,
  title,
  message,
  buttons = [{ text: 'OK' }],
  onDismiss,
}: CustomAlertProps) {
  const handleButtonPress = (button: AlertButton) => {
    button.onPress?.();
    onDismiss?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
        <ThemedView className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-sm w-full mx-4">
          <ThemedText type="subtitle" className="mb-2 font-bold">
            {title}
          </ThemedText>
          {message && (
            <ThemedText className="mb-4 text-gray-700 dark:text-gray-300">
              {message}
            </ThemedText>
          )}
          <View className="flex-row justify-end space-x-2">
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                className={`px-4 py-2 rounded ${
                  button.style === 'destructive'
                    ? 'bg-red-500'
                    : button.style === 'cancel'
                    ? 'bg-gray-300 dark:bg-gray-600'
                    : 'bg-blue-500'
                }`}
                onPress={() => handleButtonPress(button)}
              >
                <ThemedText
                  className={`text-center ${
                    button.style === 'cancel' ? '' : 'text-white'
                  }`}
                >
                  {button.text}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}