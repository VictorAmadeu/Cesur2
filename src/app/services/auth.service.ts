import { Injectable } from '@angular/core';
import { AxiosService } from './axios.service';
import { UsuarioRepository } from './database-movil/repositories/usuario.repository';
import { Usuario } from '../types/usuario.type';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private axiosService: AxiosService, private userRepository: UsuarioRepository) { }

  async login(username: string, password: string, rememberMe: boolean): Promise<Usuario> {
    try {
      const { data } = await this.axiosService.post<Usuario>('/login', { username, password });
      console.log(data)
      if (rememberMe) {
        localStorage.setItem('username', username);
      }else{
        localStorage.removeItem('username');
      }
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      const usuario: Usuario = {
        ...data,
        username,
        loggedAt: Date.now(),
      };

      await this.userRepository.saveUsuario(usuario);
      console.log('Login exitoso:', data);
      return data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  async logout() {
    try {
      // Borrar solo la info sensible
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('loggedAt');
      // No tocamos 'username' para que quede autocompletado

      await this.userRepository.deleteUsuario();
    } catch (error) {
      console.error('Error durante el logout:', error);
    }
  }


}
