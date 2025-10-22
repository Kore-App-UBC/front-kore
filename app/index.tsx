import { Camera, CameraView } from 'expo-camera';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, NativeEventEmitter, NativeModules, StyleSheet, Text, View } from 'react-native';
import { Circle, Line, Svg } from "react-native-svg";

export default function Index() {
  const [cameraPermissionWasGranted, setCameraPermissionWasGranted] = useState(false);
  const [currentPose, setCurrentPose] = useState<any>(null);
  const cameraRef = useRef<CameraView>(null);
  const intervalRef = useRef<number | null>(null);

  const { PoseLandmarks } = NativeModules;
  const poseLandmarksEmitter = new NativeEventEmitter(PoseLandmarks);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  const requestCameraPermissions = useCallback(async () => {
    const result = await Camera.requestCameraPermissionsAsync();

    setCameraPermissionWasGranted(result.granted);
  }, []);
  
  useEffect(() => {
    requestCameraPermissions();
    PoseLandmarks.initModel();

    const statusSubscription = poseLandmarksEmitter.addListener('onPoseLandmarksStatus', (event: any) => {
      console.log('Pose Landmarks Status:', event.status);
    });

    const errorSubscription = poseLandmarksEmitter.addListener('onPoseLandmarksError', (event: any) => {
      console.error('Pose Landmarks Error:', event.error);
    });

    const detectionSubscription = poseLandmarksEmitter.addListener('onPoseLandmarksDetected', (event: any) => {
      console.log('Detected Poses:', event.landmarks);
      if (event.landmarks && event.landmarks.length > 0) {
        setCurrentPose(event.landmarks[0]);
      }
    });

    return () => {
      statusSubscription.remove();
      errorSubscription.remove();
      detectionSubscription.remove();
    };
  }, [requestCameraPermissions]);

  useEffect(() => {
    if (cameraPermissionWasGranted) {
      // Start processing frames every second
      intervalRef.current = setInterval(async () => {
        if (cameraRef.current) {
          try {
            const photo = await cameraRef.current.takePictureAsync({ 
              base64: true,
              // fastMode: true,
              shutterSound: false,
              skipProcessing: true,
              isImageMirror: true
            });

            if (photo?.base64) {
              await processFrame(photo.base64);
            }
          } catch (error) {
            console.error('Error capturing frame:', error);
          }
        }
      }, 500); // Every 1 second
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [cameraPermissionWasGranted]);

  const processFrame = async (frameData: string) => {
    try {
      PoseLandmarks.processFrame(frameData);

      console.log('Frame processed:');
    } catch (error) {
      console.error('Error processing frame:', error);
    }
  };

  // Pose connections (skeleton bones)
  const POSE_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 7], // Nose to left eye/ear
    [0, 4], [4, 5], [5, 6], [6, 8], // Nose to right eye/ear
    [9, 10], // Mouth
    [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], // Left arm
    [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], // Right arm
    [11, 23], [12, 24], // Shoulders to hips
    [23, 24], // Hips
    [23, 25], [25, 27], [27, 29], [29, 31], // Left leg
    [24, 26], [26, 28], [28, 30], [30, 32], // Right leg
  ];

  const renderSkeleton = () => {
    if (!currentPose) return null;

    const keypoints = currentPose.map((point: any) => ({
      x: point.x * screenWidth,
      y: point.y * screenHeight,
    }));

    return (
      <Svg style={StyleSheet.absoluteFill}>
        {/* Draw connections */}
        {POSE_CONNECTIONS.map(([start, end]) => {
          const startPoint = keypoints[start];
          const endPoint = keypoints[end];
          if (!startPoint || !endPoint) return null;

          return (
            <Line
              key={`${start}-${end}`}
              x1={startPoint.x}
              y1={startPoint.y}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke="red"
              strokeWidth="3"
            />
          );
        })}

        {/* Draw keypoints */}
        {keypoints.map((point: any, index: number) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="blue"
          />
        ))}
      </Svg>
    );
  };

  if (!cameraPermissionWasGranted) {
    return (
      <Text>
        {"Camera permission wasn't granted"}
      </Text>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        animateShutter={false}
      />
      {renderSkeleton()}
    </View>
  );
}