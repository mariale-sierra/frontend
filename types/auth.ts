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
  /** B4: JWT that lasts 15 minutes. */
  accessToken: string;
  /** B4: opaque, single use (each refresh returns a new one). Absent from a backend older than B4. */
  refreshToken?: string;
  user: AuthUserContract;
  [key: string]: unknown;
}
