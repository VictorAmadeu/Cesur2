export interface Order {
  id: string;
  customer: string;
  address: string;
  status: 'pending' | 'delivered' | 'cancelled';
  date: string;
  synced?: number;
  motivo?: string;
  observaciones?: string;
}