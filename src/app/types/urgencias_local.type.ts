export interface UrgenciaLocal {
  expediente_id: number;
  tipo_documento_id: string;
  firmado: boolean;
  firmadoBase64?: string;
  cachedAt?: number;
  synced?: number;
}
