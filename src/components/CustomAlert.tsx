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
        <ThemedView variant="surface" className="p-6 rounded-3xl max-w-sm w-full mx-4">
          <ThemedText type="subtitle" className="mb-2 font-bold">
            {title}
          </ThemedText>
          {message && (
            <ThemedText className="mb-4 text-muted">
              {message}
            </ThemedText>
          )}
          <View className="flex-row justify-end space-x-2">
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                className={`px-4 py-2 rounded-2xl ${
                  button.style === 'destructive'
                    ? 'bg-danger'
                    : button.style === 'cancel'
                    ? 'bg-surface-transparent border border-outline'
                    : 'bg-accent'
                }`}
                onPress={() => handleButtonPress(button)}
              >
                <ThemedText
                  className={`text-center ${
                    button.style === 'cancel' ? 'text-muted' : 'text-white'
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