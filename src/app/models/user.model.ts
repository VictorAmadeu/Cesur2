export interface User {
  username: string;
  roles: string[];
}

export interface UserDB {
  id?: number;               // autoincremental en Dexie
  username: string;          // nombre de usuario
  roles: string[];           // roles del usuario
  access_token?: string;     // token JWT actual
  refresh_token?: string;    // refresh token
  token_expiry?: number;     // timestamp de expiración del access_token
  synced?: number;           // 0 = no sincronizado con backend
}

export interface LoginResponse {
  username: string;
  roles: string[];
  token_type: string;       // ej: "Bearer"
  access_token: string;
  expires_in: number;       // segundos
  refresh_token: string;
}
