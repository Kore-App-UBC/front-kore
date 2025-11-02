import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import Toast from "react-native-toast-message";
import { ThemedText } from '../components/themed-text';
import { AnimatedThemedView } from '../components/themed-view';
import { useAuth } from '../hooks/useAuth';

const logoSource = require('../../assets/images/icon.png');

export default function LoginScreen() {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [emailError, setEmailError] = useState('');
   const [passwordError, setPasswordError] = useState('');
   const { signIn, loading, error } = useAuth();

   const primaryGlow = useSharedValue(0);
   const secondaryGlow = useSharedValue(0);

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
       transform: [
         { translateX },
         { translateY },
         { rotate },
       ],
       opacity,
     };
   });

   const secondaryGlowStyle = useAnimatedStyle(() => {
     const translateX = interpolate(secondaryGlow.value, [0, 1], [20, -35]);
     const translateY = interpolate(secondaryGlow.value, [0, 1], [10, -40]);
     const rotate = `${interpolate(secondaryGlow.value, [0, 1], [-8, 10])}deg`;
     const opacity = interpolate(secondaryGlow.value, [0, 1], [0.3, 0.6]);
     return {
       transform: [
         { translateX },
         { translateY },
         { rotate },
       ],
       opacity,
     };
   });

   const validateEmail = (email: string) => {
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     return emailRegex.test(email);
   };

   const validatePassword = (password: string) => {
     return password.length >= 6;
   };

   const handleLogin = async () => {
     let isValid = true;
     setEmailError('');
     setPasswordError('');

     if (!email) {
       setEmailError('E-mail é obrigatório');
       isValid = false;
     } else if (!validateEmail(email)) {
       setEmailError('Por favor, insira um endereço de e-mail válido');
       isValid = false;
     }

     if (!password) {
       setPasswordError('Senha é obrigatória');
       isValid = false;
     } else if (!validatePassword(password)) {
       setPasswordError('A senha deve ter pelo menos 6 caracteres');
       isValid = false;
     }

     if (!isValid) return;

     try {
      const result = await signIn(email, password);

      if (!result.success) {
        Toast.show({
          type: 'error',
          text1: 'Falha no login',
          text2: result.error || 'Ocorreu um erro durante o login. Por favor, tente novamente.',
        });
      }
     } catch {
      Toast.show({
         type: 'error',
         text1: 'Falha no login',
         text2: 'Ocorreu um erro durante o login. Por favor, tente novamente.',
       });
     }
   };

  return (
    <LinearGradient
      colors={['#05070F', '#0C1326', '#162447']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      className="flex-1 relative overflow-hidden"
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
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

        <View className="flex-1 justify-center px-6 py-12">
        <Animated.View
          entering={FadeInDown.duration(450).springify().damping(18)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 60 }}
          // className="justify-center items-center gap-10 mb-10"
        >
          <Image className='mx-auto !size-24' source={logoSource} resizeMode="contain" />
          <ThemedText type="title" className="text-center mb-1">Kore</ThemedText>
          <ThemedText className="text-center text-muted">Reabilitação personalizada, pronta quando você precisar.</ThemedText>
        </Animated.View>

        <AnimatedThemedView
          variant="surfaceStrong"
          className="rounded-4xl p-8 mx-2 border border-outline-strong"
          entering={FadeInDown.delay(110).duration(450).springify().damping(14)}
          // layout={LinearTransition.springify().damping(14)}
        >
          <ThemedText type="title" className="text-center mb-8">Bem-vindo de volta</ThemedText>

          <View className="mb-6">
            <View className="mb-4">
              <TextInput
                className={`rounded-3xl px-5 py-4 text-base text-white bg-surface border ${emailError ? 'border-danger/80' : 'border-outline'}`}
                placeholder="E-mail"
                placeholderTextColor="#7A86A8"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
              {emailError && (
                <AnimatedThemedView
                  variant="surface"
                  className="border border-danger/40 rounded-2xl p-3 mt-2"
                  entering={FadeInUp.duration(300)}
                >
                  <ThemedText className="text-danger text-sm">{emailError}</ThemedText>
                </AnimatedThemedView>
              )}
            </View>

            <View className="mb-4">
              <TextInput
                className={`rounded-3xl px-5 py-4 text-base text-white bg-surface border ${passwordError ? 'border-danger/80' : 'border-outline'}`}
                placeholder="Senha"
                placeholderTextColor="#7A86A8"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                }}
                secureTextEntry
                editable={!loading}
              />
              {passwordError && (
                <AnimatedThemedView
                  variant="surface"
                  className="border border-danger/40 rounded-2xl p-3 mt-2"
                  entering={FadeInUp.duration(300)}
                >
                  <ThemedText className="text-danger text-sm">{passwordError}</ThemedText>
                </AnimatedThemedView>
              )}
            </View>
          </View>

          {error && (
            <AnimatedThemedView
              variant="surface"
              className="border border-danger/40 rounded-3xl p-4 mb-6"
              entering={FadeInUp.duration(350)}
            >
              <ThemedText className="text-danger text-center text-sm">{error}</ThemedText>
            </AnimatedThemedView>
          )}

          <TouchableOpacity
            className="rounded-3xl overflow-hidden"
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#555D78', '#444B63'] : ['#7F5AF0', '#5A3BE6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="py-4 px-6 items-center"
            >
                {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText className="text-white text-lg font-semibold">Entrar</ThemedText>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </AnimatedThemedView>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  keyboardAvoider: {
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
  logo: {
    width: 96,
    height: 96,
    marginBottom: 16,
  },
});
