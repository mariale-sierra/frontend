import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export async function login(email: string, password: string) {
  console.log('login function called with:', email, password); // Debugging log
  try {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken } = response.data;

    await AsyncStorage.setItem('token', accessToken);
    return response.data;
  } catch (error: any) {
    console.error('Login error:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
      stack: error?.stack,
    });
    throw error; // Re-throw the error after logging
  }
}

export async function register(email: string, username: string, password: string) {
  const response = await api.post('/auth/register', { email, username, password });
  const { accessToken } = response.data;
  await AsyncStorage.setItem('token', accessToken);
  return response.data;
}

export async function logout() {
  await AsyncStorage.removeItem('token');
}

export async function getToken() {
  return await AsyncStorage.getItem('token');
}