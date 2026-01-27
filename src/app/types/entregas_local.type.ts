export interface EntregaLocal {
  ruta_id: number;
  expediente_id: number;
  // Fecha (YYYY-MM-DD) asociada a la entrega para filtrar por día
  fecha: string;
  metodo: "NFC" | "manual";
  qrCode?: string;
  motivo?: string;
  observacion?: string;
  timestamp: number;
  synced: number;
}
