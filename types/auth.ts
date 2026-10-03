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

/** Both must be true for the backend to accept a registration (T&C + 16+). */
export interface LegalConsent {
  acceptTerms: boolean;
  confirmAge16: boolean;
}

export interface RegisterRequest extends LegalConsent {
  email: string;
  username: string;
  password: string;
}

export interface AuthSessionResponse {
  accessToken: string;
  user: AuthUserContract;
  [key: string]: unknown;
}
