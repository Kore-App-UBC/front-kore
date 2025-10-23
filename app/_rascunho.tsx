import { cameraComponentProps, MediapipePoint, usePoseDetectionProcessor } from '@/src/utils/poseDetection';
import { Canvas, Line } from '@shopify/react-native-skia';
import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";

interface ContainerSize {
  width: number;
  height: number;
}

export default function Index() {
  const device = useCameraDevice('back')
  const { hasPermission } = useCameraPermission();
  
  const [containerSize, setContainerSize] = useState<ContainerSize | null>(null);
  const [landmarks, setLandmarks] = useState<MediapipePoint[]>([]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  const poseDetectionProcessor = usePoseDetectionProcessor((detectedLandmarks) => {
    setLandmarks(detectedLandmarks);
  }, []);

  const drawSkeleton = () => {
    if (landmarks.length === 0 || !containerSize) return null;

    const { width: containerWidth, height: containerHeight } = containerSize;
    const lines: React.JSX.Element[] = [];
    const connections = [
  // Face
  [8, 6],   // Right ear to right eye outer
  [6, 5],   // Right eye outer to right eye
  [5, 4],   // Right eye to right eye inner
  [4, 0],   // Right eye inner to nose
  [0, 1],   // Nose to left eye inner
  [1, 2],   // Left eye inner to left eye
  [2, 3],   // Left eye to left eye outer
  [3, 7],   // Left eye outer to left ear
  [10, 9],  // Mouth right to mouth left

  // Torso
  [11, 12], // Shoulders
  [11, 23], // Left shoulder to left hip
  [12, 24], // Right shoulder to right hip
  [23, 24], // Hips

  // Left Arm
  [11, 13], // Left shoulder to left elbow
  [13, 15], // Left elbow to left wrist
  
  // Right Arm
  [12, 14], // Right shoulder to right elbow
  [14, 16], // Right elbow to right wrist

  // Left Leg
  [23, 25], // Left hip to left knee
  [25, 27], // Left knee to left ankle

  // Right Leg
  [24, 26], // Right hip to right knee
  [26, 28], // Right knee to right ankle
];

    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];

      if (startPoint && endPoint) {
        // --- COORDINATE TRANSFORMATION LOGIC ---

        // 1. Handle Rotation (Sensor's Landscape -> View's Portrait)
        const p1x_rotated = startPoint.y * containerWidth;
        let p1y_rotated = startPoint.x * containerHeight; // Note: 'let' now
        
        const p2x_rotated = endPoint.y * containerWidth;
        let p2y_rotated = endPoint.x * containerHeight; // Note: 'let' now

        // 2. Handle Mirroring (Front Camera)
        const p1x_mirrored = containerWidth - p1x_rotated;
        const p2x_mirrored = containerWidth - p2x_rotated;
        
        // 3. ✅ Handle Vertical Flip (Final Step)
        // const p1y_final = containerHeight - p1y_rotated;
        // const p2y_final = containerHeight - p2y_rotated;

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

  if (!hasPermission) return <Text>No permission</Text>;
  if (device == null) return <Text>No camera</Text>;

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={poseDetectionProcessor}
        resizeMode="contain" 
        {...cameraComponentProps}
      />
      {containerSize && (
        <Canvas style={StyleSheet.absoluteFill}>
          {drawSkeleton()}
        </Canvas>
      )}
    </View>
  );
}