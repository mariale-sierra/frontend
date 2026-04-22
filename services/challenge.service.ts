import api from './api';

export async function getChallenges() {
  const response = await api.get('/challenges');
  return response.data;
}

export async function getChallenge(id: string) {
  const response = await api.get(`/challenges/${id}`);
  return response.data;
}

export async function createChallenge(data: {
  name: string;
  description?: string;
  instructions?: string;
  visibility: string;
  duration_days: number;
  cycle_length_days?: number;
}) {
  const response = await api.post('/challenges', data);
  return response.data;
}

export async function joinChallenge(id: number) {
  const response = await api.post(`/challenges/${id}/join`);
  return response.data;
}