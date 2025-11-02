import { ResizeMode, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import CustomAlert from '../src/components/CustomAlert';
import { apiService } from '../src/services/api';
import { getAlertState, hideAlert, registerAlertSetter, showAlert } from '../src/utils/alert';

export default function ReviewRecordingPage() {
  const { uri, exerciseId }: { uri?: string; exerciseId?: string } = useLocalSearchParams();
  const router = useRouter();
  const videoRef = useRef<Video | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [patientComments, setPatientComments] = useState<string>('');
  const { width: windowWidth } = Dimensions.get('window');
  const horizontalPadding = 16 * 2; // matches container padding left/right
  const videoHeight = (windowWidth - horizontalPadding) * (9 / 16);
  const [alertState, setAlertState] = useState(getAlertState());

  React.useEffect(() => {
    registerAlertSetter(setAlertState);
  }, []);

  const handleSend = async () => {
    if (!uri) {
      showAlert('Nenhum vídeo', 'Nenhum vídeo gravado foi fornecido.');
      return;
    }

    if (!exerciseId) {
      showAlert('Exercício ausente', 'Nenhum id de exercício fornecido para enviar a gravação.');
      return;
    }

    setIsSending(true);
    setUploadProgress(0);

    try {
      const videoFile = {
        uri: `file://${uri}`,
        name: 'video.mp4',
        type: 'video/mp4',
      };

      const resp = await apiService.submitExercise(
        exerciseId as string,
        videoFile as any,
        patientComments || undefined,
        ({ loaded, total }) => {
          const progress = total ? (loaded / total) * 100 : 0;
          const capped = Math.min(100, Math.max(0, progress));
          setUploadProgress(capped);
        },
        () => {
          setUploadProgress(100);
        }
      );

      showAlert('Enviado', resp?.message || 'Vídeo enviado com sucesso.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      console.error('Send failed', e);
      const message = e?.message || e?.responseData?.message || 'Falha ao enviar vídeo.';
      showAlert('Erro', message);
      setUploadProgress(0);
    } finally {
      setIsSending(false);
      setTimeout(() => setUploadProgress(0), 600);
    }
  };

  const handleRetake = () => {
    // Go back to the previous screen where the user can record again
    router.back();
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Revisar gravação</Text>
          {!uri ? (
            <Text style={styles.message}>Nenhuma gravação encontrada.</Text>
          ) : (
            <View style={[styles.videoContainer, { height: videoHeight }]}>
              <Video
                ref={videoRef}
                source={{ uri }}
                style={[styles.video, { width: '100%', height: '100%', alignSelf: 'center' }]}
                useNativeControls
                isLooping={false}
                resizeMode={ResizeMode.CONTAIN}
              />
            </View>
          )}

          {/* Upload progress bar (visible while sending) */}
          {(isSending || uploadProgress > 0) && (
            <View style={styles.progressSection}>
              <Text style={styles.progressText}>{Math.round(uploadProgress)}%</Text>
              <View style={styles.progressContainer} accessibilityRole="progressbar" accessibilityValue={{ now: Math.round(uploadProgress), min: 0, max: 100 }}>
                <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
              </View>
            </View>
          )}

          <View style={styles.commentSection}>
            <Text style={styles.commentLabel}>Comentários (opcional)</Text>
            <TextInput
              value={patientComments}
              onChangeText={setPatientComments}
              placeholder="Adicione notas para seu fisioterapeuta..."
              placeholderTextColor="#999"
              style={styles.commentBox}
              multiline
              numberOfLines={3}
              editable={!isSending}
            />
          </View>

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.sendButton]} onPress={handleSend} disabled={isSending}>
              <Text style={styles.buttonText}>{isSending ? 'Enviando...' : 'Enviar'}</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.retakeButton]} onPress={handleRetake} disabled={isSending}>
              <Text style={styles.buttonText}>Regravar</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onDismiss={hideAlert}
      />
    </>
  );
}

const styles = StyleSheet.create({
  keyboardAvoider: {
    flex: 1,
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    backgroundColor: '#000',
    padding: 64,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    marginTop: 18,
  },
  message: {
    color: '#fff',
    marginTop: 24,
  },
  commentSection: {
    width: '100%',
    marginTop: 16,
  },
  commentLabel: {
    color: '#fff',
    marginBottom: 8,
  },
  commentBox: {
    backgroundColor: '#111',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  videoContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    flexGrow: 1,
    marginTop: 20,
    backgroundColor: '#111',
    borderRadius: 8,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  progressSection: {
    width: '100%',
    marginTop: 12,
    alignItems: 'center',
  },
  progressText: {
    color: '#fff',
    marginBottom: 6,
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#222',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1e88e5',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  sendButton: {
    backgroundColor: '#1e88e5',
  },
  retakeButton: {
    backgroundColor: '#9e9e9e',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
