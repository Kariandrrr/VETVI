export interface UserCreate {
  display_name: string;
  email: string;
  password: string;
}

export interface UserRead {
  id: string;
  display_name: string;
  email: string;
  role: string;
  created_at: string;
  avatar_url?: string | null;
}

export interface Token {
  access_token: string;
  refresh_token: string;
}

export interface AuthError {
  detail: string;
}