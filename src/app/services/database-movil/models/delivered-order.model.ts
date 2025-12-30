export interface DeliveredOrder {
  id?: number;               // opcional, autogenerado en DB local
  route_id: number;          // ID de la ruta
  expediente_id: number;     // ID del expediente
  status: 'DELIVERED' | 'PENDING' | 'FAILED'; // Estado de la entrega
  synced: 0 | 1;             // 0 = no sincronizado, 1 = sincronizado
  created_at?: string;       // fecha de creación opcional
  updated_at?: string;       // fecha de actualización opcional
  reason?: string;         // motivo de no entrega, opcional
  observations?: string;  // observaciones adicionales, opcional
}
