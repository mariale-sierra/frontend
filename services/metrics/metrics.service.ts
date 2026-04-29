import api from '../api';

export async function addMetricToWorkoutLogExercise(
  wleId: number,
  metricCode: string,
  value: number,
) {
  const response = await api.post(`/metrics/workout-log-exercises/${wleId}`, {
    metricCode,
    value,
  });
  return response.data;
}
