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
      baseURL: environment.apiUrl,
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        apiSecret: environment.apiSecret,
      },
    });

    // Interceptor para agregar token si existe (sin imprimir headers)
    this.axiosInstance.interceptors.request.use(config => {
      const token = localStorage.getItem('access_token');

      if (token) {
        config.headers!['Authorization'] = `Bearer ${token}`;
      }

      return config;
    });

    this.axiosInstance.interceptors.response.use(
      response => response,
      error => {
        const axiosError: AxiosErrorResponse = {
          status: error.response?.status,
          code: error.code,
          message: error.message,
          response: error.response?.data,
        };

        // Log mínimo: sin payloads completos
        console.error('Error en respuesta:', {
          status: axiosError.status,
          code: axiosError.code,
          message: axiosError.message,
        });

        if (axiosError.status === 401) {
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
