import { Injectable } from '@angular/core';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { AxiosErrorResponse } from '../types/axios.type';

@Injectable({
  providedIn: 'root',
})
export class AxiosService {
  private axiosInstance: AxiosInstance;

  constructor(private router: Router) {
    this.axiosInstance = axios.create({
      baseURL: environment.apiUrl, //'/api', // Usar proxy en desarrollo
      timeout: 30000,
      withCredentials: true, // <-- IMPORTANTE: envía cookies automáticamente
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'apiSecret': 'lPdXmvjVpSi8HQWEEeEtC8GFPWZWb6Kt',
      },
    });

    // Interceptor para agregar token si existe
    this.axiosInstance.interceptors.request.use(config => {
      const token = localStorage.getItem('access_token');

      if (token) {
        // Agregamos el token al header
        config.headers!['Authorization'] = `Bearer ${token}`;
      }

      console.log('Request Headers:', config.headers);

      return config;
    });

    // Interceptor para manejar respuestas y errores
    this.axiosInstance.interceptors.response.use(
      response => response,
      error => {
        const axiosError: AxiosErrorResponse = {
          status: error.response?.status,
          code: error.code,
          message: error.message,
          response: error.response?.data,
        };

        console.error('Error en respuesta:', JSON.stringify(axiosError));

        // Manejar token vencido o sesión inválida
        if (axiosError.status === 401) {
          console.warn('Token expirado o no autorizado, redirigiendo a login...');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          this.router.navigate(['/login']);
        }

        return Promise.reject(axiosError);
      }
    );
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.axiosInstance.post<T>(url, data, config);
  }

  get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.axiosInstance.get<T>(url, config);
  }
}
