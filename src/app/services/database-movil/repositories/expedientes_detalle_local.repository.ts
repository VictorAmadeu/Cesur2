import { Injectable } from '@angular/core';
import { SqliteService } from '../sqlite.service';
import { Comensal, ExpedienteDetalleLocal } from '../../../types/expedientes_detalle_local.type';

@Injectable({
  providedIn: 'root',
})
export class ExpedientesRepository {
  constructor(private sqlite: SqliteService) {}

  // Insertar expediente + comensales
  async addExpediente(expediente_req: ExpedienteDetalleLocal): Promise<void> {
    console.log("EXpediente", expediente_req)
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


  // Obtener un expediente con sus comensales
  async getExpedienteById(expediente_id: number): Promise<ExpedienteDetalleLocal | null> {
    const rows = await this.sqlite.query(
      'SELECT * FROM expedientes_detalle_local WHERE expediente_id = ?',
      [expediente_id]
    );

    if (!rows.length) return null;

    const expedienteRow = rows[0];

    return {
      expediente_id: expedienteRow.expediente_id,
      notas: JSON.parse(expedienteRow.notas || '[]'),
      comensales: JSON.parse(expedienteRow.comensales || '[]'),
      cachedAt: expedienteRow.cachedAt,
      synced: expedienteRow.synced,
    } as ExpedienteDetalleLocal;
  }
  

  // Obtener expedientes pendientes de sincronizar
  async getPendingExpedientes(): Promise<ExpedienteDetalleLocal[]> {
    const rows = await this.sqlite.query(
      'SELECT * FROM expedientes_local WHERE synced = 0'
    );

    const result: ExpedienteDetalleLocal[] = [];
    for (const row of rows) {
      const comensales = await this.sqlite.query(
        'SELECT * FROM comensales WHERE expediente_id = ?',
        [row.expediente_id]
      );
      result.push({
        expediente: row.expediente,
        expediente_id: row.expediente_id,
        notas: JSON.parse(row.notas || '[]'),
        comensales: comensales.map((c: any) => ({
          ...c,
          notasDieta: JSON.parse(c.notasDieta || '[]'),
          notasReparto: JSON.parse(c.notasReparto || '[]'),
          aportesEspeciales: JSON.parse(c.aportesEspeciales || '[]'),
        })),
        cachedAt: row.cachedAt,
        synced: row.synced,
      });
    }
    return result;
  }

  async markAsSynced(expediente_id: number): Promise<void> {
    await this.sqlite.execute(
      'UPDATE expedientes_local SET synced = 1 WHERE expediente_id = ?',
      [expediente_id]
    );
  }

  async deleteExpediente(expediente_id: number): Promise<void> {
    await this.sqlite.execute(
      'DELETE FROM expedientes_local WHERE expediente_id = ?',
      [expediente_id]
    );
    await this.sqlite.execute(
      'DELETE FROM comensales WHERE expediente_id = ?',
      [expediente_id]
    );
  }

  async clear(): Promise<void> {
    const query = `DELETE FROM expedientes_detalle_local`;
    await this.sqlite.execute(query);
  }
}
