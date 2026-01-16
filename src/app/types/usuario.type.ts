export interface Usuario {
  username: string;
  roles: string[];
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  loggedAt: number; 
}
