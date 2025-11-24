import React from "react";
import { Platform, Text, View } from "react-native";
import AnimatedBackground from "../components/AnimatedBackground";

const isAndroid = Platform.OS === "android";

const UnsupportedScreen = () => (
  <AnimatedBackground>
    <View className="flex flex-col justify-center items-center w-full h-full px-6">
      <Text className="text-white text-2xl select-none text-center">
        Esta tela só é compatível com Android.
      </Text>
    </View>
  </AnimatedBackground>
);

export default function ExerciseDetailScreen() {
  if (isAndroid) {
    const ScreenElement = require("@/screens/ExerciseDetailScreenMobile").default as typeof import("@/screens/ExerciseDetailScreenMobile").default;
    return <ScreenElement />;
  }

  return <UnsupportedScreen />;
}
