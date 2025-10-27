import React from 'react';
import { Alert } from 'react-native';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
}

let alertState: AlertState = {
  visible: false,
  title: '',
  message: '',
  buttons: [],
};

let setAlertState: React.Dispatch<React.SetStateAction<AlertState>> | null = null;

export const registerAlertSetter = (setter: React.Dispatch<React.SetStateAction<AlertState>>) => {
  setAlertState = setter;
};

export const showAlert = (title: string, message?: string, buttons?: AlertButton[]) => {
  if (setAlertState) {
    alertState = {
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: 'OK' }],
    };
    setAlertState(alertState);
  } else {
    // Fallback to native Alert if setter not registered
    Alert.alert(title, message, buttons);
  }
};

export const hideAlert = () => {
  if (setAlertState) {
    alertState = { ...alertState, visible: false };
    setAlertState(alertState);
  }
};

export const getAlertState = () => alertState;