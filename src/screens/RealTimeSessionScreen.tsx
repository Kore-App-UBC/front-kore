import { FilesetResolver, NormalizedLandmark, PoseLandmarker } from '@mediapipe/tasks-vision';
import { Camera, CameraView } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';

// WebSocket URL for pose feedback
const wsUrl = 'ws://localhost:3000/pose';

export default function RealTimeSessionScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);
  const [poseLandmarks, setPoseLandmarks] = useState<NormalizedLandmark[][] | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [repCounts, setRepCounts] = useState<number>(0);
  const cameraRef = useRef<CameraView>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      // Initialize MediaPipe PoseLandmarker
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
        );
        const poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1
        });
        setPoseLandmarker(poseLandmarkerInstance);
        poseLandmarkerRef.current = poseLandmarkerInstance;
      } catch (error) {
        console.error('Failed to initialize PoseLandmarker:', error);
        Alert.alert('Error', 'Failed to initialize pose detection');
      }
    })();
  }, []);

  const startSession = () => {
    if (!hasPermission) {
      Alert.alert('Camera Permission Required', 'Please enable camera permissions to use real-time sessions.');
      return;
    }
    if (!poseLandmarker) {
      Alert.alert('Pose Detection Not Ready', 'Please wait for pose detection to initialize.');
      return;
    }
    setIsRecording(true);
    startFrameProcessing();

    // Initialize WebSocket connection
    try {
      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.onopen = () => console.log('WebSocket connected');
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.feedback_message) {
            setFeedbackMessage(data.feedback_message);
          }
          if (data.rep_counts !== undefined) {
            setRepCounts(data.rep_counts);
          }
        } catch (parseError) {
          console.error('Failed to parse WebSocket message:', parseError);
        }
      };
      wsRef.current.onerror = (error) => console.error('WebSocket error:', error);
      wsRef.current.onclose = () => console.log('WebSocket closed');
    } catch (error) {
      console.error('WebSocket initialization error:', error);
    }

    Alert.alert('Session Started', 'Pose detection is now active.');
  };

  const processFrame = async (imageData: ImageData) => {
    if (!poseLandmarkerRef.current) return;

    try {
      const result = poseLandmarkerRef.current.detectForVideo(imageData, Date.now());
      if (result.landmarks && result.landmarks.length > 0) {
        setPoseLandmarks(result.landmarks);
        // Send pose data via WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const poseData = {
            pose_landmarks: result.landmarks[0].map(landmark => ({
              x: landmark.x,
              y: landmark.y,
              z: landmark.z || 0,
              visibility: landmark.visibility || 1
            })),
            timestamp: Date.now()
          };
          wsRef.current.send(JSON.stringify(poseData));
        }
      }
    } catch (error) {
      console.error('Pose detection error:', error);
    }
  };

  const startFrameProcessing = () => {
    if (!cameraRef.current) return;

    const processNextFrame = async () => {
      try {
        // For web compatibility, we'll use a placeholder approach
        // In a real implementation, you'd capture frames from the camera stream
        // For now, we'll simulate frame processing
        if (isRecording && poseLandmarkerRef.current) {
          // TODO: Implement actual frame capture from camera stream
          // This would typically involve getting ImageData from the camera feed
          animationFrameRef.current = requestAnimationFrame(processNextFrame);
        }
      } catch (error) {
        console.error('Frame processing error:', error);
      }
    };

    processNextFrame();
  };

  const stopSession = () => {
    setIsRecording(false);
    setPoseLandmarks(null);
    setFeedbackMessage('');
    setRepCounts(0);

    // Stop frame processing
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Close WebSocket connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // TODO: Stop MediaPipe pose detection and process results
    Alert.alert('Session Ended', 'Session completed. Results will be processed.');
  };

  if (hasPermission === null) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText>Requesting camera permission...</ThemedText>
      </ThemedView>
    );
  }

  if (hasPermission === false) {
    return (
      <ThemedView className="flex-1 justify-center items-center p-4">
        <ThemedText className="text-red-500 text-center mb-4">
          Camera access is required for real-time exercise sessions.
        </ThemedText>
        <TouchableOpacity
          onPress={() => Camera.requestCameraPermissionsAsync()}
          className="bg-blue-500 px-4 py-2 rounded"
        >
          <ThemedText className="text-white">Grant Permission</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const PoseOverlay = () => {
    if (!poseLandmarks || poseLandmarks.length === 0) return null;

    const { width, height } = Dimensions.get('window');
    const landmarks = poseLandmarks[0];

    return (
      <View style={StyleSheet.absoluteFill}>
        {landmarks.map((landmark, index) => (
          <View
            key={index}
            style={{
              position: 'absolute',
              left: landmark.x * width,
              top: landmark.y * height,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: 'red',
              borderWidth: 2,
              borderColor: 'white',
            }}
          />
        ))}
      </View>
    );
  };

  return (
    <ThemedView className="flex-1">
      <ThemedText type="title" className="p-4 text-center">Real-Time Session</ThemedText>

      <ThemedView className="flex-1 p-4">
        <ThemedView className="flex-1 rounded-lg overflow-hidden mb-4 relative">
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="front"
          >
            <ThemedView className="flex-1 justify-center items-center">
              <ThemedText className="text-white text-lg font-bold bg-black bg-opacity-50 px-4 py-2 rounded">
                {isRecording ? 'Recording Session...' : 'Camera Ready'}
              </ThemedText>
            </ThemedView>
            {isRecording && (
              <ThemedView className="absolute top-4 left-4 right-4">
                {feedbackMessage && (
                  <ThemedText className="text-white text-lg font-bold bg-black bg-opacity-70 px-4 py-2 rounded mb-2">
                    {feedbackMessage}
                  </ThemedText>
                )}
                <ThemedText className="text-white text-xl font-bold bg-blue-500 bg-opacity-80 px-4 py-2 rounded self-start">
                  Reps: {repCounts}
                </ThemedText>
              </ThemedView>
            )}
          </CameraView>
          {isRecording && <PoseOverlay />}
        </ThemedView>

        <ThemedView className="flex-row justify-center space-x-4">
          {!isRecording ? (
            <TouchableOpacity
              onPress={startSession}
              className="bg-green-500 px-6 py-3 rounded-lg"
            >
              <ThemedText className="text-white font-bold">Start Session</ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={stopSession}
              className="bg-red-500 px-6 py-3 rounded-lg"
            >
              <ThemedText className="text-white font-bold">Stop Session</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>

        <ThemedView className="mt-4 p-4 bg-gray-100 rounded-lg">
          <ThemedText type="subtitle" className="mb-2">Status:</ThemedText>
          <ThemedText className="text-sm mb-1">• Camera: {hasPermission ? 'Ready' : 'Not granted'}</ThemedText>
          <ThemedText className="text-sm mb-1">• Pose Detection: {poseLandmarker ? 'Initialized' : 'Loading...'}</ThemedText>
          <ThemedText className="text-sm mb-1">• Session: {isRecording ? 'Active' : 'Inactive'}</ThemedText>
          <ThemedText className="text-sm mb-2">• Landmarks: {poseLandmarks ? `${poseLandmarks[0]?.length || 0} detected` : 'None'}</ThemedText>
          <ThemedText type="subtitle" className="mb-2">Instructions:</ThemedText>
          <ThemedText className="text-sm mb-1">• Position yourself in front of the camera</ThemedText>
          <ThemedText className="text-sm mb-1">• Ensure good lighting</ThemedText>
          <ThemedText className="text-sm mb-1">• Red dots will appear on detected pose landmarks</ThemedText>
          <ThemedText className="text-sm">• Real-time feedback will be provided during sessions</ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
});