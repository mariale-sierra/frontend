import api from '../api';
import { clearAccessToken, getAccessToken, setAccessToken } from './token.service';
import { storage } from '../../utils/storage';
import type {
  AuthSessionResponse,
  LoginRequest,
  RegisterRequest,
} from '../../types/auth';

export async function login(email: string, password: string) {
  console.log('login function called with:', email, password); // Debugging log
  try {
    const payload: LoginRequest = { email, password };
    const response = await api.post<AuthSessionResponse>('/auth/login', payload);
    const { accessToken, user } = response.data;

    await setAccessToken(accessToken);
    if (user?.id) {
      await storage.setItem('userId', String(user.id));
    }
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
  const payload: RegisterRequest = { email, username, password };
  const response = await api.post<AuthSessionResponse>('/auth/register', payload);
  const { accessToken, user } = response.data;
  await setAccessToken(accessToken);
  if (user?.id) {
    await storage.setItem('userId', String(user.id));
  }
  return response.data;
}

export async function logout() {
  await clearAccessToken();
  await storage.removeItem('userId');
}

export async function getToken() {
  return await getAccessToken();
}

export async function getUserId() {
  return await storage.getItem('userId');
}
