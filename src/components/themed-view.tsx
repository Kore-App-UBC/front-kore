import { BlurView } from 'expo-blur';
import { forwardRef, useMemo } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  className?: string;
  variant?: 'background' | 'surface' | 'surfaceStrong' | 'transparent';
};

export const ThemedView = forwardRef<View, ThemedViewProps>(function ThemedView(
  {
    style,
    lightColor,
    darkColor,
    className,
    variant = 'background',
    children,
    ...viewProps
  },
  ref,
) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const colorKey =
    variant === 'surfaceStrong'
      ? 'surfaceStrong'
      : variant === 'surface'
      ? 'surface'
      : variant === 'transparent'
      ? 'surfaceTransparent'
      : 'background';

  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, colorKey as keyof typeof palette) as string;

  const { baseStyle, blurIntensity } = useMemo(() => {
    if (variant === 'surface') {
      return {
        baseStyle: {
          borderWidth: 1,
          borderColor: palette.border,
          shadowColor: palette.shadow,
          shadowOpacity: 0.32,
          shadowRadius: 26,
          shadowOffset: { width: 0, height: 18 },
          elevation: 12,
        } as const,
        blurIntensity: 28,
      };
    }

    if (variant === 'surfaceStrong') {
      return {
        baseStyle: {
          borderWidth: 1,
          borderColor: palette.borderStrong,
          shadowColor: palette.shadow,
          shadowOpacity: 0.42,
          shadowRadius: 32,
          shadowOffset: { width: 0, height: 20 },
          elevation: 16,
        } as const,
        blurIntensity: 36,
      };
    }

    return {
      baseStyle: {
        borderWidth: 0,
      } as const,
      blurIntensity: 0,
    };
  }, [variant, palette]);

  const shouldBlur = blurIntensity > 0;
  const blurTint = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <View
      ref={ref}
      className={className}
      style={[{ backgroundColor }, baseStyle, style]}
      {...viewProps}
    >
      {shouldBlur ? (
        <View className='rounded-4xl overflow-hidden' style={styles.blurOverlay}>
          <BlurView
            pointerEvents="none"
            intensity={blurIntensity}
            tint={blurTint}
            style={styles.blurOverlay}
          />
        </View>
      ) : null}
      {children}
    </View>
  );
});

export const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

const styles = StyleSheet.create({
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
