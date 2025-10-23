import { NativeModules } from "react-native";
import { CameraProps, Frame, useFrameProcessor, VisionCameraProxy } from "react-native-vision-camera";
import { isWorkletFunction } from "react-native-worklets";
import { useRunOnJS } from "react-native-worklets-core";

export type MediapipePoint = {
  x: number;
  y: number;
  z: number;
}

type MediapipeOutput = MediapipePoint[][];

export const cameraComponentProps: Partial<CameraProps> = {
  pixelFormat: "rgb"
}; 

const plugin = VisionCameraProxy.initFrameProcessorPlugin('detectPose', {});
const { PoseLandmarkerModule } = NativeModules;
PoseLandmarkerModule
  .initialize()
  .then((status: any) => console.log('PoseLandmarkerModule initialized with status: ', status))
  .catch((err: Error) => console.error(err));

const detectPose = (frame: Frame): MediapipePoint[] => {
  'worklet';

  if (plugin === null) throw new Error("Failed to load frame processor plugin 'detectPose'!");

  const result = plugin?.call(frame) as unknown as MediapipeOutput;

  return result?.[0] || [];
}

export type OnPoseDetectionCallback = (landmarks: MediapipePoint[]) => void;
export const usePoseDetectionProcessor = (callback: OnPoseDetectionCallback, dependencies: React.DependencyList) => {
  const landmarkCallback = !isWorkletFunction(callback) ? useRunOnJS(callback, dependencies) : callback;

  return useFrameProcessor((frame) => {
    'worklet';

    const landmarks = detectPose(frame);
    landmarkCallback(landmarks);
  }, dependencies);
}