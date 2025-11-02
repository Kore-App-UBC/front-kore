import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { Canvas, Line } from '@shopify/react-native-skia';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import RNFS from 'react-native-fs';
import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";
import ExerciseAnimationPreview from '../components/ExerciseAnimationPreview';
import { PrescribedExercise } from '../types';
import { cameraComponentProps, MediapipePoint, usePoseDetectionProcessor } from '../utils/poseDetection';

interface ExerciseDetailScreenProps {
  exercise?: string;
}

export default function ExerciseDetailScreenMobile() {
  const { exercise }: ExerciseDetailScreenProps = useLocalSearchParams();
  const parsedExercise: PrescribedExercise = useMemo(() => exercise ? JSON.parse(exercise) : null, [exercise]);
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const device = useCameraDevice(cameraPosition);
  const { hasPermission } = useCameraPermission();

  const cameraRef = useRef<Camera>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedFile, setRecordedFile] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const RECORD_TARGET = 10;

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      setCameraActive(true);
    } else {
      if (isRecording) {
        try {
          stopRecording();
        } catch (e) {
          console.error('Error stopping recording on blur', e);
        }
      }
      setCameraActive(false);
    }
  }, [isFocused]);

  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const [landmarks, setLandmarks] = useState<MediapipePoint[]>([]);
  const [repCount, setRepCount] = useState(0);
  const [exerciseStage, setExerciseStage] = useState<string | null>(null);
  const exerciseStageRef = useRef<string | null>(null);

  // Update ref whenever exerciseStage changes
  useEffect(() => {
    exerciseStageRef.current = exerciseStage;
  }, [exerciseStage]);

  const lastActivityTime = useRef(Date.now());
  const lastExecutionTime = useRef(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  const poseDetectionProcessor = usePoseDetectionProcessor((detectedLandmarks) => {
    // Always update landmarks for visualization, but only evaluate/count
    // repetitions while actively recording.
    setLandmarks(detectedLandmarks);
    if (isRecording && detectedLandmarks.length > 0 && parsedExercise?.exercise.classificationData) {
      processExercise(detectedLandmarks, parsedExercise.exercise.classificationData);
    }
  }, [parsedExercise, isRecording]);

  const router = useRouter();
  const hasNavigatedToReview = useRef(false);

  const desiredFormat = useMemo(() => {
    if (!device) return null;

    const format = device.formats.find(format =>
      format.minFps <= 10
    );

    return format || null;
  }, [device]);

  const startRecording = async () => {
    if (!cameraRef.current) return;
    setRecordedFile(null);
    setRepCount(0);
    setIsRecording(true);
    try {
      hasNavigatedToReview.current = false;
      cameraRef.current.startRecording({
        flash: 'off',
        fileType: 'mp4',
        path: `${RNFS.ExternalCachesDirectoryPath}/`,
        // audio: false,
        onRecordingFinished: (video: any) => {
          setIsRecording(false);
          const uri = video?.path || video?.filePath || video?.uri || null;

          setRecordedFile(uri);
        },
        onRecordingError: (error: any) => {
          console.error('Recording error', error);
          setIsRecording(false);
        },
      });
    } catch (e) {
      console.error('startRecording error', e);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (!cameraRef.current) return;
    try {
      cameraRef.current.stopRecording();
    } catch (e) {
      console.error('stopRecording error', e);
      setIsRecording(false);
    }
  };

  // Auto-stop when target reps reached
  useEffect(() => {
    if (isRecording && repCount >= RECORD_TARGET) {
      stopRecording();
    }
  }, [repCount, isRecording]);

  // Navigate to review screen once recording finished and target reached
  useEffect(() => {
    if (
      recordedFile &&
      repCount >= RECORD_TARGET &&
      !isRecording &&
      !hasNavigatedToReview.current
    ) {
      hasNavigatedToReview.current = true;
      try {
        router.push({ pathname: '/review-recording', params: { uri: recordedFile, exerciseId: parsedExercise?.exercise.id } });
      } catch (e) {
        console.error('Navigation to review failed', e);
      }
    }
  }, [recordedFile, repCount, isRecording, router]);

  const calculateAngle = (a: MediapipePoint, b: MediapipePoint, c: MediapipePoint): number => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  };

  const getLandmark = (landmarks: MediapipePoint[], index: number): MediapipePoint | null => {
    return landmarks[index] || null;
  };

  const processExercise = (landmarks: MediapipePoint[], classificationData: any) => {
    const now = Date.now();
    if (now - lastExecutionTime.current < 500) return; // Throttle execution to at least 500ms apart
    lastExecutionTime.current = now;

    if (!classificationData || !classificationData.landmarks || classificationData.landmarks.length < 3) return;

    const { thresholds, evaluationType } = classificationData;
    const currentStage = exerciseStageRef.current;
    const landmarkIndices: { [key: string]: number } = {
      'nose': 0,
      'left_eye_inner': 1,
      'left_eye': 2,
      'left_eye_outer': 3,
      'right_eye_inner': 4,
      'right_eye': 5,
      'right_eye_outer': 6,
      'left_ear': 7,
      'right_ear': 8,
      'mouth_left': 9,
      'mouth_right': 10,
      'left_shoulder': 11,
      'right_shoulder': 12,
      'left_elbow': 13,
      'right_elbow': 14,
      'left_wrist': 15,
      'right_wrist': 16,
      'left_pinky': 17,
      'right_pinky': 18,
      'left_index': 19,
      'right_index': 20,
      'left_thumb': 21,
      'right_thumb': 22,
      'left_hip': 23,
      'right_hip': 24,
      'left_knee': 25,
      'right_knee': 26,
      'left_ankle': 27,
      'right_ankle': 28,
      'left_heel': 29,
      'right_heel': 30,
      'left_foot_index': 31,
      'right_foot_index': 32,
    };

    const points = classificationData.landmarks.map((landmark: string) => getLandmark(landmarks, landmarkIndices[landmark?.toLowerCase?.() || ""]));

    if (points.some((p: MediapipePoint | null) => p === null)) return;

    const angle = calculateAngle(points[0], points[1], points[2]);

    if (evaluationType === 'high_to_low') {
      // For exercises like bicep curls: start with high angle, end with low angle
      if (angle > thresholds.up) {
        setExerciseStage('start');
      }
      if (angle < thresholds.down && currentStage === 'start') {
        setExerciseStage('end');
        setRepCount(prev => prev + 1);
      }
    } else if (evaluationType === 'low_to_high') {
      // For exercises like knee extensions: start with low angle, end with high angle
      if (angle < thresholds.down) {
        setExerciseStage('start');
      }
      if (angle > thresholds.up && currentStage === 'start') {
        setExerciseStage('end');
        setRepCount(prev => prev + 1);
      }
    } else if (evaluationType === 'custom') {
      // For exercises like lateral raises: start with low angle, end with high angle (but thresholds may be reversed)
      if (angle < thresholds.up) {
        setExerciseStage('start');
      }
      if (angle > thresholds.down && currentStage === 'start') {
        setExerciseStage('end');
        setRepCount(prev => prev + 1);
      }
    }

    lastActivityTime.current = Date.now();
  };

  const drawSkeleton = () => {
    if (landmarks.length === 0 || !containerSize) return null;

    const { width: containerWidth, height: containerHeight } = containerSize;
    const lines: React.JSX.Element[] = [];
    const connections = [
      // Face
      [8, 6], [6, 5], [5, 4], [4, 0], [0, 1], [1, 2], [2, 3], [3, 7], [10, 9],
      // Torso
      [11, 12], [11, 23], [12, 24], [23, 24],
      // Left Arm
      [11, 13], [13, 15],
      // Right Arm
      [12, 14], [14, 16],
      // Left Leg
      [23, 25], [25, 27],
      // Right Leg
      [24, 26], [26, 28],
    ];

    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];

      if (startPoint && endPoint) {
        // Coordinate transformation logic from rascunho
        const p1x_rotated = startPoint.y * containerWidth;
        let p1y_rotated = startPoint.x * containerHeight;

        const p2x_rotated = endPoint.y * containerWidth;
        let p2y_rotated = endPoint.x * containerHeight;

        // Mirroring for front camera only
        const isFront = cameraPosition === 'front';
        const p1x_mirrored = isFront ? containerWidth - p1x_rotated : p1x_rotated;
        const p2x_mirrored = isFront ? containerWidth - p2x_rotated : p2x_rotated;

        // Flip vertically to correct upside-down orientation
        p1y_rotated = containerHeight - p1y_rotated;
        p2y_rotated = containerHeight - p2y_rotated;

        lines.push(
          <Line
            key={`${start}-${end}`}
            p1={{ x: p1x_mirrored, y: p1y_rotated }}
            p2={{ x: p2x_mirrored, y: p2y_rotated }}
            color="red"
            strokeWidth={3}
          />
        );
      }
    });

    return lines;
  };

  if (!hasPermission) return <Text className='text-white'>Sem permissão</Text>;
  if (device == null) return <Text className='text-white'>Sem câmera</Text>;

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={cameraActive}
        frameProcessor={poseDetectionProcessor}
        resizeMode="contain"
        format={desiredFormat || undefined}
        fps={desiredFormat ? 10 : undefined}
        {...cameraComponentProps}
      />
      {containerSize && (
        <Canvas style={StyleSheet.absoluteFill}>
          {drawSkeleton()}
        </Canvas>
      )}
      {/* Animation overlay in top-right */}
      <View style={styles.animationContainer}>
        <ExerciseAnimationPreview
          animationData={parsedExercise?.exercise.animationData}
          width={150}
          height={150}
        />
      </View>
      {/* Recording controls - top-right below animation */}
      <View style={styles.recordControlContainer}>
          <Pressable
          style={styles.flipButton}
          onPress={() => setCameraPosition(prev => prev === 'front' ? 'back' : 'front')}
          accessibilityLabel="Trocar câmera"
        >
          <MaterialIcons name="flip-camera-android" size={22} color="white" />
        </Pressable>
        {!isRecording ? (
          <Pressable style={styles.recordButton} onPress={startRecording} accessibilityLabel="Iniciar gravação">
            <MaterialIcons name="fiber-manual-record" size={20} color="white" />
          </Pressable>
        ) : (
          <Pressable style={[styles.recordButton, styles.recording]} onPress={stopRecording} accessibilityLabel="Parar gravação">
            <MaterialIcons name="stop" size={20} color="white" />
          </Pressable>
        )}
        {isRecording && <View style={styles.recordingDot} />}
      </View>
      {/* Rep count display */}
      <View style={styles.repCountContainer}>
        <Text style={styles.repCountText}>Repetições: {repCount}</Text>
        <Text style={styles.stageText}>Fase: {exerciseStage || 'Nenhuma'}</Text>
        {repCount > 10 && (
          <Text style={styles.congratulationText}>Bom trabalho! Você completou mais de 10 repetições!</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  animationContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    padding: 10,
  },
  repCountContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    padding: 10,
  },
  repCountText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  congratulationText: {
    color: 'yellow',
    fontSize: 16,
    marginTop: 5,
  },
  stageText: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
  },
  recordControlContainer: {
    position: 'absolute',
    top: 200,
    right: 20,
    alignItems: 'center',
  },
  flipButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  flipButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  recordButton: {
    backgroundColor: '#e53935',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  recordButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  recording: {
    backgroundColor: '#b71c1c',
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
    marginTop: 8,
  },
});