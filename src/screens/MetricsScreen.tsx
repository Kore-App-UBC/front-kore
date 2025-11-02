import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import Svg, { Circle, G, Rect, Text as SvgText } from 'react-native-svg';
import CustomAlert from '../components/CustomAlert';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { apiService } from '../services/api';
import { Metrics } from '../types';
import { getAlertState, hideAlert, registerAlertSetter, showAlert } from '../utils/alert';

type BarDatum = { label: string; value: number };

function BarChart({ data, width = 320, height = 140 }: { data: BarDatum[]; width?: number; height?: number }) {
  const padding = 12;
  const chartWidth = Math.max(0, width - padding * 2);
  const chartHeight = height - 24; // leave space for labels
  const max = Math.max(...data.map((d) => d.value), 1);
  const barGap = 8;
  const barWidth = Math.max(6, (chartWidth - barGap * (data.length - 1)) / data.length);

  return (
    <Svg width={width} height={height}>
      <G x={padding} y={8}>
        {data.map((d, i) => {
          const x = i * (barWidth + barGap);
          const h = (d.value / max) * chartHeight;
          const y = chartHeight - h;
          return (
            <G key={i}>
              <Rect x={x} y={y} width={barWidth} height={h} fill="#7F5AF0" rx={4} />
              <SvgText
                x={x + barWidth / 2}
                y={chartHeight + 14}
                fontSize={10}
                fill="#A0ABC6"
                textAnchor="middle"
              >
                {d.label.length > 10 ? `${d.label.slice(0, 10)}…` : d.label}
              </SvgText>
            </G>
          );
        })}
      </G>
    </Svg>
  );
}

function DonutChart({ active, completed, size = 140, strokeWidth = 18 }: { active: number; completed: number; size?: number; strokeWidth?: number }) {
  const total = active + completed;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const completedPortion = total > 0 ? completed / total : 0;
  const completedLength = circumference * completedPortion;
  const activeLength = circumference - completedLength;

  // center coordinates
  const cx = size / 2;
  const cy = size / 2;

  return (
    <Svg width={size} height={size}>
      {/* background circle */}
  <Circle cx={cx} cy={cy} r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} fill="transparent" />
      {/* completed arc */}
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
  stroke="#7F5AF0"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="transparent"
        strokeDasharray={`${completedLength} ${activeLength}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* active arc (drawn as remaining part) */}
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke="#2CB67D"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="transparent"
        strokeDasharray={`${activeLength} ${completedLength}`}
        strokeDashoffset={-completedLength}
        opacity={0}
      />

      {/* center text */}
      <SvgText x={cx} y={cy - 6} fontSize={18} fill="#F6F8FF" textAnchor="middle">
        {total}
      </SvgText>
      <SvgText x={cx} y={cy + 14} fontSize={12} fill="#A0ABC6" textAnchor="middle">
        Completado: {completed}
      </SvgText>
    </Svg>
  );
}

export default function MetricsScreen() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [alertState, setAlertState] = useState(getAlertState());

  useEffect(() => {
    registerAlertSetter(setAlertState);
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getMetrics();
      setMetrics(data);
    } catch (err) {
      setError('Falha ao carregar métricas');
      showAlert('Erro', 'Falha ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <ThemedView variant="transparent" className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#7F5AF0" />
            <ThemedText className="mt-4">Carregando métricas...</ThemedText>
        </ThemedView>
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

  if (error) {
    return (
      <>
        <ThemedView variant="transparent" className="flex-1 justify-center items-center p-4">
          <ThemedText className="text-danger text-center mb-4">{error}</ThemedText>
          <ThemedText
            className="text-accent underline"
            onPress={fetchMetrics}
          >
              Tentar novamente
          </ThemedText>
        </ThemedView>
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

  return (
    <>
      <ScrollView className="flex-1 pb-32">
        <ThemedView variant="transparent" className="p-6">
        <ThemedText type="title" className="mb-6">Métricas</ThemedText>

        {metrics && (
          <ThemedView className="gap-4">
            <ThemedView variant="surface" className="p-5 rounded-3xl">
              <ThemedText type="subtitle" className="mb-2">Total de pacientes</ThemedText>
              <ThemedText className="text-2xl font-bold text-accent">{metrics.totalPatients}</ThemedText>
            </ThemedView>

            <ThemedView variant="surface" className="p-5 rounded-3xl">
              <ThemedText type="subtitle" className="mb-2">Total de fisioterapeutas</ThemedText>
              <ThemedText className="text-2xl font-bold text-success">{metrics.totalPhysiotherapists ?? metrics.totalPhysios ?? 0}</ThemedText>
            </ThemedView>

            <ThemedView variant="surface" className="p-5 rounded-3xl">
              <ThemedText type="subtitle" className="mb-2">Total de exercícios</ThemedText>
              <ThemedText className="text-2xl font-bold text-accent-soft">{metrics.totalExercises}</ThemedText>
            </ThemedView>

            <ThemedView variant="surface" className="p-5 rounded-3xl">
              <ThemedText type="subtitle" className="mb-2">Envios ativos (não revisadas)</ThemedText>
              <ThemedText className="text-2xl font-bold text-warning">{metrics.activeSubmissionsNotReviewed ?? metrics.activeSessions ?? 0}</ThemedText>
            </ThemedView>

            <ThemedView variant="surface" className="p-5 rounded-3xl">
              <ThemedText type="subtitle" className="mb-2">Sessões concluídas (revisadas)</ThemedText>
              <ThemedText className="text-2xl font-bold text-success">{metrics.completeSessionsReviewed ?? metrics.completedSessions ?? 0}</ThemedText>
            </ThemedView>

            {/* Exercises by prescription (with small bar chart) */}
            <ThemedView variant="surfaceStrong" className="p-5 rounded-3xl">
              <ThemedText type="subtitle" className="mb-2">Exercícios por prescrição</ThemedText>
              {metrics.exercisesByPrescription && metrics.exercisesByPrescription.length > 0 ? (
                <ThemedView className="gap-2 mt-2 rounded-lg" variant='surfaceStrong'>
                  <View className="items-center">
                    <BarChart
                      data={metrics.exercisesByPrescription.map((ex) => ({
                        label: ex.exerciseName ?? ex.exerciseId,
                        value: ex.prescribedCount ?? 0,
                      }))}
                      width={320}
                      height={140}
                    />
                  </View>

                  {metrics.exercisesByPrescription.map((ex) => (
                    <ThemedView key={ex.exerciseId} className="flex-row justify-between items-center bg-transparent border-none px-3 py-1" variant='surfaceStrong'>
                      <ThemedText className="text-base">{ex.exerciseName ?? ex.exerciseId}</ThemedText>
                      <ThemedText className="text-sm font-semibold text-muted">{ex.prescribedCount}</ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>
              ) : (
                <ThemedText className="text-sm text-muted mt-2">Nenhuma prescrição encontrada para sua clínica.</ThemedText>
              )}
            </ThemedView>

            {/* Submissions vs Completed chart */}
            <ThemedView variant="surface" className="p-5 rounded-3xl">
              <ThemedText type="subtitle" className="mb-2">Envios: Ativos vs Concluídos</ThemedText>
              <View className="items-center mt-2">
                <DonutChart
                  active={metrics.activeSubmissionsNotReviewed ?? metrics.activeSessions ?? 0}
                  completed={metrics.completeSessionsReviewed ?? metrics.completedSessions ?? 0}
                  size={140}
                />
              </View>
              <ThemedView className="flex-row justify-around mt-4 p-3 rounded-lg" variant='surfaceStrong'>
                <ThemedView className="items-center border-none" variant='surfaceStrong'>
                  <View className="w-4 h-4 bg-warning rounded-full" />
                  <ThemedText className="text-sm mt-1">Ativos</ThemedText>
                </ThemedView>
                <ThemedView className="items-center border-none" variant='surfaceStrong'>
                  <View className="w-4 h-4 bg-success rounded-full" />
                  <ThemedText className="text-sm mt-1">Concluídos</ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        )}
      </ThemedView>
      </ScrollView>
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