import { FilesetResolver, NormalizedLandmark, PoseLandmarker } from '@mediapipe/tasks-vision';
import { Camera, CameraView } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { getAlertState, hideAlert, registerAlertSetter, showAlert } from '../utils/alert';

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
  const [alertState, setAlertState] = useState(getAlertState());

  useEffect(() => {
    registerAlertSetter(setAlertState);
  }, []);

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
        showAlert('Error', 'Failed to initialize pose detection');
      }
    })();
  }, []);

  const startSession = () => {
    if (!hasPermission) {
      showAlert('Permissão da câmera necessária', 'Por favor, ative as permissões da câmera para usar sessões em tempo real.');
      return;
    }
    if (!poseLandmarker) {
      showAlert('Detecção de pose não pronta', 'Aguarde a inicialização da detecção de pose.');
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

    showAlert('Sessão iniciada', 'A detecção de pose está ativa.');
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
    showAlert('Sessão encerrada', 'Sessão concluída. Os resultados serão processados.');
  };

  if (hasPermission === null) {
    return (
      <ThemedView variant="transparent" className="flex-1 justify-center items-center">
        <ThemedText>Solicitando permissão da câmera...</ThemedText>
      </ThemedView>
    );
  }

  if (hasPermission === false) {
    return (
      <ThemedView variant="transparent" className="flex-1 justify-center items-center p-4">
        <ThemedText className="text-danger text-center mb-4">
          O acesso à câmera é necessário para sessões de exercício em tempo real.
        </ThemedText>
        <TouchableOpacity
          onPress={() => Camera.requestCameraPermissionsAsync()}
          className="bg-accent px-5 py-3 rounded-2xl"
        >
          <ThemedText className="text-white">Conceder permissão</ThemedText>
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
              backgroundColor: '#7F5AF0',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.6)',
            }}
          />
        ))}
      </View>
    );
  };

  return (
    <>
      <ThemedView variant="transparent" className="flex-1">
        <ThemedText type="title" className="p-4 text-center">Real-Time Session</ThemedText>

        <ThemedView variant="transparent" className="flex-1 p-4">
          <ThemedView variant="surfaceStrong" className="flex-1 rounded-3xl overflow-hidden mb-4 relative">
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="front"
            >
              <ThemedView className="flex-1 justify-center items-center">
                <ThemedText className="text-white text-lg font-bold bg-surface-strong px-4 py-2 rounded-2xl">
                  {isRecording ? 'Gravando sessão...' : 'Câmera pronta'}
                </ThemedText>
              </ThemedView>
              {isRecording && (
                <ThemedView className="absolute top-4 left-4 right-4">
                  {feedbackMessage && (
                    <ThemedText className="text-white text-lg font-bold bg-surface-strong px-4 py-2 rounded-2xl mb-2">
                      {feedbackMessage}
                    </ThemedText>
                  )}
                  <ThemedText className="text-white text-xl font-bold bg-accent px-4 py-2 rounded-2xl self-start">
                    Repetições: {repCounts}
                  </ThemedText>
                </ThemedView>
              )}
            </CameraView>
            {isRecording && <PoseOverlay />}
          </ThemedView>

          <ThemedView className="flex-row justify-center gap-4">
            {!isRecording ? (
              <TouchableOpacity
                onPress={startSession}
                className="bg-success px-6 py-3 rounded-2xl"
              >
                <ThemedText className="text-white font-bold">Iniciar sessão</ThemedText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={stopSession}
                className="bg-danger px-6 py-3 rounded-2xl"
              >
                <ThemedText className="text-white font-bold">Encerrar sessão</ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>

          <ThemedView variant="surface" className="mt-4 p-5 rounded-3xl">
            <ThemedText type="subtitle" className="mb-2">Status:</ThemedText>
            <ThemedText className="text-sm mb-1 text-muted">• Câmera: {hasPermission ? 'Pronta' : 'Não concedida'}</ThemedText>
            <ThemedText className="text-sm mb-1 text-muted">• Detecção de pose: {poseLandmarker ? 'Inicializada' : 'Carregando...'}</ThemedText>
            <ThemedText className="text-sm mb-1 text-muted">• Sessão: {isRecording ? 'Ativa' : 'Inativa'}</ThemedText>
            <ThemedText className="text-sm mb-2 text-muted">• Pontos detectados: {poseLandmarks ? `${poseLandmarks[0]?.length || 0} detectados` : 'Nenhum'}</ThemedText>
            <ThemedText type="subtitle" className="mb-2">Instruções:</ThemedText>
            <ThemedText className="text-sm mb-1 text-muted">• Posicione-se em frente à câmera</ThemedText>
            <ThemedText className="text-sm mb-1 text-muted">• Garanta boa iluminação</ThemedText>
            <ThemedText className="text-sm mb-1 text-muted">• Pontos vermelhos aparecerão nos marcos de pose detectados</ThemedText>
            <ThemedText className="text-sm text-muted">• Feedback em tempo real será fornecido durante as sessões</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onDismiss={hideAlert}
      />
    </>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
});