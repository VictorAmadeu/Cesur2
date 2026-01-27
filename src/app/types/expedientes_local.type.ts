export interface ExpedienteLocal {
  expediente_id: number;
  ruta_id: number;
  expediente: string;
  direccion: string;
  orden: number;
  comidas: number;
  cenas: number;
  cachedAt: number;
  notasReparto?: string;
}

export interface ExpedienteApi {
  expediente_id: number;
  expediente: string;
  direccion: string;
  comidas: number;
  orden: number;
  cenas: number;
  notasReparto?: string;
}