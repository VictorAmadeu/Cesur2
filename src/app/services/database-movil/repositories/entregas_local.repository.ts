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
        (ruta_id, expediente_id, metodo, qrCode, motivo, observacion, timestamp, synced)
      VALUES ( ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await this.sqlite.execute(query, [
      entrega.ruta_id,
      entrega.expediente_id,
      entrega.metodo,
      entrega.qrCode || null,
      entrega.motivo || null,
      entrega.observacion || null,
      entrega.timestamp,
      entrega.synced,
    ]);
  }

  async getEntregaById(expediente_id: number): Promise<EntregaLocal | null> {
    const rows = await this.sqlite.query(
      'SELECT * FROM entregas_local WHERE expediente_id = ?',
      [expediente_id]
    );
    return rows.length ? (rows[0] as EntregaLocal) : null;
  }

    async getEntregaByRoutes(ruta_id: number): Promise<EntregaLocal | null> {
    const rows = await this.sqlite.query(
      'SELECT * FROM entregas_local WHERE ruta_id = ?',
      [ruta_id]
    );
    return rows.length ? (rows[0] as EntregaLocal) : null;
  }

  async getPendingEntregas(): Promise<EntregaLocal[]> {
    const rows = await this.sqlite.query(
      'SELECT * FROM entregas_local WHERE synced = 0'
    );
    return rows as EntregaLocal[];
  }

  async markAsSynced(expediente_id: number): Promise<void> {
    await this.sqlite.execute(
      'UPDATE entregas_local SET synced = 1 WHERE expediente_id = ?',
      [expediente_id]
    );
  }

  async deleteEntrega(expediente_id: number): Promise<void> {
    await this.sqlite.execute(
      'DELETE FROM entregas_local WHERE expediente_id = ?',
      [expediente_id]
    );
  }
  
  async clear(): Promise<void> {
    const query = `DELETE FROM entregas_local`;
    await this.sqlite.execute(query);
  }
}
