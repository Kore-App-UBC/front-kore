import { Camera, CameraView } from 'expo-camera';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

export default function Index() {
  const [cameraPermissionWasGranted, setCameraPermissionWasGranted] = useState(false);
  
  const requestCameraPermissions = useCallback(async () => {
    const result = await Camera.requestCameraPermissionsAsync();

    setCameraPermissionWasGranted(result.granted);
  }, []);
  
  useEffect(() => {
    requestCameraPermissions();
  }, [requestCameraPermissions]);

  if (!cameraPermissionWasGranted) {
    return (
      <Text>
        {"Camera permission wasn't granted"}
      </Text>
    );
  }

  return (
    <CameraView
      style={StyleSheet.absoluteFill}
      facing="front"
    />
  );
}