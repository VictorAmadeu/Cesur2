import { Injectable } from '@angular/core';
import { SqliteService } from '../sqlite.service';
import { EntregaLocal } from 'src/app/types/entregas_local.type';

@Injectable({
  providedIn: 'root',
})
export class EntregasRepository {
  constructor(private sqlite: SqliteService) {}

  async addEntrega(entrega: EntregaLocal): Promise<void> {
    const query = `
      INSERT INTO entregas_local 
        (ruta_id, expediente_id, fecha, metodo, qrCode, motivo, observacion, timestamp, synced)
      VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await this.sqlite.execute(query, [
      entrega.ruta_id,
      entrega.expediente_id,
      entrega.fecha,
      entrega.metodo,
      entrega.qrCode || null,
      entrega.motivo || null,
      entrega.observacion || null,
      entrega.timestamp,
      entrega.synced,
    ]);
  }

  async getEntregaById(expediente_id: number, fecha?: string): Promise<EntregaLocal | null> {
    const query = fecha
      ? 'SELECT * FROM entregas_local WHERE expediente_id = ? AND fecha = ?'
      : 'SELECT * FROM entregas_local WHERE expediente_id = ?';
    const params = fecha ? [expediente_id, fecha] : [expediente_id];
    const rows = await this.sqlite.query(query, params);
    return rows.length ? (rows[0] as EntregaLocal) : null;
  }

  async getEntregaByRoutes(ruta_id: number, fecha?: string): Promise<EntregaLocal | null> {
    const query = fecha
      ? 'SELECT * FROM entregas_local WHERE ruta_id = ? AND fecha = ?'
      : 'SELECT * FROM entregas_local WHERE ruta_id = ?';
    const params = fecha ? [ruta_id, fecha] : [ruta_id];
    const rows = await this.sqlite.query(query, params);
    return rows.length ? (rows[0] as EntregaLocal) : null;
  }

  // Devuelve todas las rutas que tienen al menos una entrega local registrada (1 query en vez de N).
  async getRutaIdsWithEntregas(fecha?: string): Promise<number[]> {
    const query = fecha
      ? 'SELECT DISTINCT ruta_id FROM entregas_local WHERE fecha = ?'
      : 'SELECT DISTINCT ruta_id FROM entregas_local';
    const params = fecha ? [fecha] : [];
    const rows = await this.sqlite.query(query, params);
    return rows
      .map((row: any) => Number(row.ruta_id))
      .filter((id: number) => Number.isFinite(id));
  }

  // Devuelve todos los expedientes entregados para una ruta concreta (1 query en vez de N).
  async getExpedienteIdsByRuta(ruta_id: number, fecha?: string): Promise<number[]> {
    const query = fecha
      ? 'SELECT expediente_id FROM entregas_local WHERE ruta_id = ? AND fecha = ?'
      : 'SELECT expediente_id FROM entregas_local WHERE ruta_id = ?';
    const params = fecha ? [ruta_id, fecha] : [ruta_id];
    const rows = await this.sqlite.query(query, params);
    return rows
      .map((row: any) => Number(row.expediente_id))
      .filter((id: number) => Number.isFinite(id));
  }

  async getPendingEntregas(): Promise<EntregaLocal[]> {
    const rows = await this.sqlite.query('SELECT * FROM entregas_local WHERE synced = 0');
    return rows as EntregaLocal[];
  }

  async markAsSynced(expediente_id: number, fecha?: string): Promise<void> {
    const query = fecha
      ? 'UPDATE entregas_local SET synced = 1 WHERE expediente_id = ? AND fecha = ?'
      : 'UPDATE entregas_local SET synced = 1 WHERE expediente_id = ?';
    const params = fecha ? [expediente_id, fecha] : [expediente_id];
    await this.sqlite.execute(query, params);
  }

  async deleteEntrega(expediente_id: number): Promise<void> {
    await this.sqlite.execute('DELETE FROM entregas_local WHERE expediente_id = ?', [expediente_id]);
  }

  async clear(): Promise<void> {
    const query = `DELETE FROM entregas_local`;
    await this.sqlite.execute(query);
  }
}
