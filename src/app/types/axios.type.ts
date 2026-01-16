export interface AxiosErrorResponse {
  status?: number;
  code?: string;
  message: string;
  response?: any;
}

export interface EncryptedApiResponse<T> {
  data: {
    date: string;
    responseId: string;
    signature: string;
    data: string; // este es el base64 encriptado
  };
  status: number;
  statusText: string;
}