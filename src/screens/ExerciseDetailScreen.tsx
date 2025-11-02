import { Platform, Text, View } from "react-native";

const isAndroid = Platform.OS === "android";
let ScreenElement = () => (
  <View className="flex flex-col justify-center items-center w-full h-full">
    <Text className="text-white text-2xl select-none">This screen is only supported for Android.</Text>
  </View>
);

if (isAndroid) {
  ScreenElement = require("@/screens/ExerciseDetailScreenMobile").default as typeof import("@/screens/ExerciseDetailScreenMobile").default;
}

export default function ExerciseDetailScreen() {
  return <ScreenElement />;
}
