import api from '../api';
import type {
  AddExerciseToRoutineRequest,
  CreateRoutineRequest,
  RoutineContract,
} from '../../types/routine';

export async function createRoutine(data: CreateRoutineRequest) {
  const response = await api.post<RoutineContract>('/routine', data);
  return response.data;
}

export async function addExerciseToRoutine(routineId: number, exerciseId: number) {
  const payload: AddExerciseToRoutineRequest = { exerciseId };
  const response = await api.post<RoutineContract>(`/routine/${routineId}/exercises`, payload);
  return response.data;
}

export async function getRoutines() {
  const response = await api.get<RoutineContract[]>('/routine');
  return response.data;
}

export async function getRoutine(id: number) {
  const response = await api.get<RoutineContract>(`/routine/${id}`);
  return response.data;
}
