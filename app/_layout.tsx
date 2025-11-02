import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';
import Toast from "react-native-toast-message";
import "./global.css";

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'dark'];

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <LinearGradient
        colors={palette.backgroundGradient as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: palette.background }}>
          <Slot />
        </View>
      </LinearGradient>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <Toast  />
    </ThemeProvider>
  );
}
