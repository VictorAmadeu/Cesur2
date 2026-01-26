export interface Comensal {
  nombre: string;
  apellidos: string;
  comidas: number;
  cenas: number;
  dieta: string;
  condiments?: string;
  panMolde?: string;
  panIndividual?: string;
  yogures?: string;
  leche?: string;
  zumo?: string;
  riesgoSocial?: string;
  bolsaSaludable?: string;
  notasDieta?: string[];
  notasReparto?: string[];
  aportesEspeciales?: string[];
  comidaEmergencia?: string;
  cumplesConAzucar?: string;
  cumplesSinAzucar?: string;

  // Nuevo campo: ID del comensal (lo debe enviar el backend en el detalle del expediente)
  comensal_id?: number | string;
}

export interface ExpedienteDetalleLocal {
  expediente: string;
  expediente_id: number;
  notas: string[];
  comensales: Comensal[];
  cachedAt: number;
  synced: number;
}
