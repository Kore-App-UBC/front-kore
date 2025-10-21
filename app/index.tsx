// import React from 'react';
// import { StyleSheet, Text } from 'react-native';
import { Skia } from "@shopify/react-native-skia";
import { useEffect } from "react";
import { NativeEventEmitter, NativeModules, Platform, StyleSheet, Text } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { Camera, Frame, useCameraDevice, useCameraPermission, useSkiaFrameProcessor, VisionCameraProxy } from "react-native-vision-camera";

// export default function Index() {
//   // return <Redirect href="/(auth)/login" />;

//   const device = useCameraDevice("back");
//   const { hasPermission } = useCameraPermission();

//   if (!hasPermission) {
//     return <Text>Permissão negada</Text>;
//   }

//   if (device == null) {
//     return <Text>Nenhum dispositivo encontrado</Text>;
//   }

//   return (
//     <Camera
//       style={StyleSheet.absoluteFill}
//       device={device}
//       isActive
//     />
//   );
// }

const { HandLandmarks } = NativeModules;

const handLandmarksEmitter = new NativeEventEmitter(HandLandmarks);

// Initialize the frame processor plugin 'handLandmarks'
const handLandMarkPlugin = VisionCameraProxy.initFrameProcessorPlugin(
  'handLandmarks',
  {},
);

// Create a worklet function 'handLandmarks' that will call the plugin function
function handLandmarks(frame: Frame) {
  'worklet';
  if (handLandMarkPlugin == null) {
    throw new Error('Failed to load Frame Processor Plugin!');
  }
  return handLandMarkPlugin.call(frame);
}

const linePaint = Skia.Paint();
linePaint.setColor(Skia.Color("red"));

const paint = Skia.Paint();
linePaint.setColor(Skia.Color("blue"));

export default function Index() {
  const landmarks = useSharedValue({});
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    // Set up the event listener to listen for hand landmarks detection results
    const subscription = handLandmarksEmitter.addListener(
      'onHandLandmarksDetected',
      event => {
        // Update the landmarks shared value to paint them on the screen
        landmarks.value = event.landmarks;

        /*
          The event contains values for landmarks and hand.
          These values are defined in the HandLandmarkerResultProcessor class
          found in the HandLandmarks.swift file.
        */
        console.log("onHandLandmarksDetected: ", event);

        /*
          This is where you can handle converting the data into commands
          for further processing.
        */
      },
    );

    // Clean up the event listener when the component is unmounted
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // Request camera permission on component mount
    requestPermission().catch(error => console.log(error));
  }, [requestPermission]);

  const frameProcessor = useSkiaFrameProcessor(frame => {
    'worklet';
    frame.render();

    // Process the frame using the 'handLandmarks' function
    handLandmarks(frame);

    /* 
      Paint landmarks on the screen.
      Note: This paints landmarks from the previous frame since
      frame processing is not synchronous.
    */
    // if (landmarks.value[0]) {
    //   const hand = landmarks.value[0];
    //   const frameWidth = frame.width;
    //   const frameHeight = frame.height;

    //   // Draw lines connecting landmarks
    //   for (const [from, to] of lines) {
    //     frame.drawLine(
    //       hand[from].x * Number(frameWidth),
    //       hand[from].y * Number(frameHeight),
    //       hand[to].x * Number(frameWidth),
    //       hand[to].y * Number(frameHeight),
    //       linePaint,
    //     );
    //   }

    //   // Draw circles on landmarks
    //   for (const mark of hand) {
    //     frame.drawCircle(
    //       mark.x * Number(frameWidth),
    //       mark.y * Number(frameHeight),
    //       6,
    //       paint,
    //     );
    //   }
    // }
  }, []);

  if (!hasPermission) {
    // Display message if camera permission is not granted
    return <Text>No permission</Text>;
  }

  if (device == null) {
    // Display message if no camera device is available
    return <Text>No device</Text>;
  }

  const pixelFormat = Platform.OS === 'ios' ? 'rgb' : 'yuv';

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
      frameProcessor={frameProcessor}
      pixelFormat={pixelFormat}
    />
  );
}