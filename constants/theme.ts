/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#7F5AF0';
const tintColorDark = '#B9A7FF';

export const Colors = {
  light: {
    text: '#F1F4FF',
    background: 'rgba(8, 11, 20, 0.92)',
    backgroundAlt: 'rgba(9, 13, 25, 0.88)',
    surface: 'rgba(18, 24, 37, 0.72)',
    surfaceStrong: 'rgba(20, 28, 44, 0.82)',
    surfaceTransparent: 'rgba(9, 13, 25, 0.35)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.16)',
    muted: '#9CA7C7',
    accent: tintColorLight,
    accentSoft: '#9877FF',
    success: '#2CB67D',
    warning: '#F2A74B',
    danger: '#EF4565',
    tint: tintColorLight,
    icon: '#A0ABC6',
    tabIconDefault: '#5E647E',
    tabIconSelected: tintColorLight,
    shadow: 'rgba(6, 12, 24, 0.7)',
    backgroundGradient: ['#04060F', '#080D1A', '#101B33'],
  },
  dark: {
    text: '#F6F8FF',
    background: 'rgba(4, 6, 12, 0.94)',
    backgroundAlt: 'rgba(7, 10, 19, 0.9)',
    surface: 'rgba(16, 22, 36, 0.74)',
    surfaceStrong: 'rgba(19, 27, 44, 0.86)',
    surfaceTransparent: 'rgba(5, 8, 15, 0.28)',
    border: 'rgba(255, 255, 255, 0.06)',
    borderStrong: 'rgba(255, 255, 255, 0.12)',
    muted: '#8690AF',
    accent: tintColorLight,
    accentSoft: '#A48AFF',
    success: '#2CB67D',
    warning: '#F2A74B',
    danger: '#EF4565',
    tint: tintColorDark,
    icon: '#97A2C4',
    tabIconDefault: '#6A718C',
    tabIconSelected: tintColorDark,
    shadow: 'rgba(4, 8, 20, 0.82)',
    backgroundGradient: ['#03040A', '#070B16', '#101A33'],
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
