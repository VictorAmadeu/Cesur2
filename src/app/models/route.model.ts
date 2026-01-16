export interface Route {
  id: string;
  driverId: number; // FK a User
  origin: string;
  destination: string;
  date: string;
  orderIds: string[]; // FK a Orders
}