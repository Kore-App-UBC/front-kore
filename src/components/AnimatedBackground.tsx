import { LinearGradient } from 'expo-linear-gradient';
import React, { ReactNode, useEffect, useMemo } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import Animated, {
    FadeIn,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

export type AnimatedBackgroundProps = {
  children: ReactNode;
  useKeyboardAvoiding?: boolean;
  keyboardVerticalOffset?: number;
  contentClassName?: string;
  className?: string;
  gradientColors?: [string, string, string];
};

const defaultGradient: [string, string, string] = ['#05070F', '#0C1326', '#162447'];

export function AnimatedBackground({
  children,
  useKeyboardAvoiding = false,
  keyboardVerticalOffset = Platform.OS === 'ios' ? 24 : 0,
  contentClassName,
  className,
  gradientColors,
}: AnimatedBackgroundProps) {
  const primaryGlow = useSharedValue(0);
  const secondaryGlow = useSharedValue(0);
  const colors = useMemo(() => gradientColors ?? defaultGradient, [gradientColors]);

  useEffect(() => {
    primaryGlow.value = withRepeat(withTiming(1, { duration: 6000 }), -1, true);
    secondaryGlow.value = withRepeat(withTiming(1, { duration: 7600 }), -1, true);
  }, [primaryGlow, secondaryGlow]);

  const primaryGlowStyle = useAnimatedStyle(() => {
    const translateX = interpolate(primaryGlow.value, [0, 1], [-30, 40]);
    const translateY = interpolate(primaryGlow.value, [0, 1], [0, -50]);
    const rotate = `${interpolate(primaryGlow.value, [0, 1], [0, 14])}deg`;
    const opacity = interpolate(primaryGlow.value, [0, 1], [0.45, 0.75]);
    return {
      transform: [{ translateX }, { translateY }, { rotate }],
      opacity,
    };
  });

  const secondaryGlowStyle = useAnimatedStyle(() => {
    const translateX = interpolate(secondaryGlow.value, [0, 1], [20, -35]);
    const translateY = interpolate(secondaryGlow.value, [0, 1], [10, -40]);
    const rotate = `${interpolate(secondaryGlow.value, [0, 1], [-8, 10])}deg`;
    const opacity = interpolate(secondaryGlow.value, [0, 1], [0.3, 0.6]);
    return {
      transform: [{ translateX }, { translateY }, { rotate }],
      opacity,
    };
  });

  const content = (
    <View className={`flex-1 ${contentClassName ?? ''}`}>
      {children}
    </View>
  );

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      className={`flex-1 relative overflow-hidden ${className ?? ''}`}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.glow, styles.glowPrimary, primaryGlowStyle]}
        entering={FadeIn.duration(600)}
      >
        <LinearGradient
          colors={['rgba(127, 90, 240, 0.65)', 'rgba(58, 255, 243, 0.12)']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.glowGradient}
        />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[styles.glow, styles.glowSecondary, secondaryGlowStyle]}
        entering={FadeIn.duration(600).delay(120)}
      >
        <LinearGradient
          colors={['rgba(90, 59, 230, 0.55)', 'rgba(140, 75, 255, 0.18)']}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 1, y: 0.9 }}
          style={styles.glowGradient}
        />
      </Animated.View>

      {useKeyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    overflow: 'hidden',
  },
  glowPrimary: {
    top: -100,
    right: -140,
  },
  glowSecondary: {
    bottom: -120,
    left: -120,
  },
  glowGradient: {
    flex: 1,
  },
});

export default AnimatedBackground;
