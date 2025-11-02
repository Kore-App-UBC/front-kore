import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import React, { useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { HapticTab } from './haptic-tab';

type HeaderRightRenderer = BottomTabNavigationOptions['headerRight'];

type FloatingTabConfig = {
  screenOptions: BottomTabNavigationOptions;
  tabPaddingBottom: number;
};

export function useFloatingTabOptions(headerRight?: HeaderRightRenderer) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const palette = Colors[colorScheme ?? 'dark'];

  return useMemo<FloatingTabConfig>(() => {
    const baseBottomSpacing = Math.max(insets.bottom, 12);
    const floatingBarOffset = 12 + baseBottomSpacing;
    const floatingBarHeight = 74;
    const contentPaddingBottom = floatingBarHeight + floatingBarOffset + 12;

    const shadowStyles =
      Platform.select<ViewStyle>({
        ios: {
          shadowColor: palette.shadow,
          shadowOpacity: 0.3,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: 16 },
        },
        android: {
          elevation: 12,
          shadowColor: palette.shadow,
        },
        default: {
          shadowColor: palette.shadow,
        },
      }) ?? {};

    return {
      screenOptions: {
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: 'transparent',
        },
        headerTitleStyle: {
          color: palette.text,
          fontSize: 18,
          fontWeight: '600',
        },
        headerTintColor: palette.text,
        headerRight,
        tabBarActiveTintColor: palette.tabIconSelected,
        tabBarInactiveTintColor: palette.tabIconDefault,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 6,
          letterSpacing: 0.2,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 128,
          right: 128,
          bottom: floatingBarOffset,
          height: floatingBarHeight,
          borderRadius: 28,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderWidth: 1,
          borderColor: palette.borderStrong,
          backgroundColor: palette.surface,
          ...shadowStyles,
        },
        tabBarItemStyle: {
          borderRadius: 20,
        },
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => (
          <View style={styles.backgroundContainer}>
            <BlurView
              experimentalBlurMethod="dimezisBlurView"
              intensity={50}
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              style={styles.blurFill}
            />
            <View style={[styles.tintOverlay, { backgroundColor: palette.surfaceStrong }]} />
          </View>
        ),
      } satisfies BottomTabNavigationOptions,
      tabPaddingBottom: contentPaddingBottom,
    } satisfies FloatingTabConfig;
  }, [colorScheme, headerRight, insets.bottom, palette]);
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },
  blurFill: {
    ...StyleSheet.absoluteFillObject,
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
});
