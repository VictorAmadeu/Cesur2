import { Injectable } from '@angular/core';
import { SqliteService } from '../sqlite.service';
import { ExpedienteDetalleLocal } from '../../../types/expedientes_detalle_local.type';

@Injectable({
  providedIn: 'root',
})
export class ExpedientesRepository {
  constructor(private sqlite: SqliteService) {}

  async addExpediente(expediente_req: ExpedienteDetalleLocal): Promise<void> {
    await this.sqlite.execute(
      `
      INSERT OR REPLACE INTO expedientes_detalle_local 
        (expediente, expediente_id, notas, comensales, cachedAt, synced)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        expediente_req.expediente ?? '',
        expediente_req.expediente_id,
        JSON.stringify(expediente_req.notas || []),
        JSON.stringify(expediente_req.comensales || []),
        expediente_req.cachedAt ?? Date.now(),
        expediente_req.synced ?? 0,
      ]
    );
  }

  async getExpedienteById(expediente_id: number): Promise<ExpedienteDetalleLocal | null> {
    const rows = await this.sqlite.query(
      'SELECT * FROM expedientes_detalle_local WHERE expediente_id = ?',
      [expediente_id]
    );

    if (!rows.length) return null;

    const row = rows[0];

    return {
      expediente: row.expediente ?? '',
      expediente_id: row.expediente_id,
      notas: JSON.parse(row.notas || '[]'),
      comensales: JSON.parse(row.comensales || '[]'),
      cachedAt: row.cachedAt,
      synced: row.synced,
    } as ExpedienteDetalleLocal;
  }

  async getPendingExpedientes(): Promise<ExpedienteDetalleLocal[]> {
    const rows = await this.sqlite.query('SELECT * FROM expedientes_detalle_local WHERE synced = 0');

    return (rows || []).map((row: any) => ({
      expediente: row.expediente ?? '',
      expediente_id: row.expediente_id,
      notas: JSON.parse(row.notas || '[]'),
      comensales: JSON.parse(row.comensales || '[]'),
      cachedAt: row.cachedAt,
      synced: row.synced,
    })) as ExpedienteDetalleLocal[];
  }

  async markAsSynced(expediente_id: number): Promise<void> {
    await this.sqlite.execute(
      'UPDATE expedientes_detalle_local SET synced = 1 WHERE expediente_id = ?',
      [expediente_id]
    );
  }

  async deleteExpediente(expediente_id: number): Promise<void> {
    await this.sqlite.execute(
      'DELETE FROM expedientes_detalle_local WHERE expediente_id = ?',
      [expediente_id]
    );
  }

  async clear(): Promise<void> {
    await this.sqlite.execute('DELETE FROM expedientes_detalle_local');
  }
}
