import React from 'react';

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
  setter(alertState);
};

export const showAlert = (title: string, message?: string, buttons?: AlertButton[]) => {
  alertState = {
    visible: true,
    title,
    message,
    buttons: buttons || [{ text: 'OK' }],
  };

  setAlertState?.(alertState);
};

export const hideAlert = () => {
  alertState = { ...alertState, visible: false };
  setAlertState?.(alertState);
};

export const getAlertState = () => alertState;