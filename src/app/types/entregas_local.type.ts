export interface EntregaLocal {
  ruta_id: number;
  expediente_id: number;
  metodo: "NFC" | "manual";
  qrCode?: string;
  motivo?: string;
  observacion?: string;
  timestamp: number;
  synced: number;
}
