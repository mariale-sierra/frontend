export interface AuthUserContract {
  id: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthSessionResponse {
  accessToken: string;
  user: AuthUserContract;
  [key: string]: unknown;
}
