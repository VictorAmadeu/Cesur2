import { Injectable } from '@angular/core';
import { SqliteService } from '../sqlite.service';
import { UrgenciaLocal } from 'src/app/types/urgencias_local.type';

@Injectable({
  providedIn: 'root'
})
export class UrgenciasRepository {

  constructor(private sqliteService: SqliteService) {}

  // 🔹 Insertar o actualizar una urgencia
  async upsertUrgencia(urgencia: UrgenciaLocal): Promise<void> {
    const cachedAt = Date.now(); // 🔹 Marca de tiempo automática

    const query = `INSERT OR REPLACE INTO urgencias_local (expediente_id, firmado, firmadoBase64, cachedAt)
      VALUES (?, ?, ?, ?)`
    await this.sqliteService.execute(
      query,
      [
        urgencia.expediente_id,
        urgencia.firmado,
        urgencia.firmadoBase64 ?? null,
        cachedAt
      ]
    );
  }

  async getPendingUrgencias(): Promise<UrgenciaLocal[]> {
    const rows = await this.sqliteService.query(
      'SELECT * FROM urgencias_local WHERE synced = 0'
    );
    return rows as UrgenciaLocal[];
  }
  // 🔹 Obtener todas las urgencias
  async getAllUrgencias(): Promise<UrgenciaLocal[]> {
    const result = await this.sqliteService.query('SELECT * FROM urgencias_local');
    return result.values as UrgenciaLocal[];
  }

  // 🔹 Obtener una urgencia por ID
  async getUrgenciaById(expedienteId: number): Promise<UrgenciaLocal | undefined> {
    const query = `SELECT * FROM urgencias_local WHERE expediente_id = ?`;
    const result: UrgenciaLocal[] = await this.sqliteService.query(query, [expedienteId]);
    return result[0]; // devuelve el primer registro o undefined si no existe
  }


  // 🔹 Marcar una urgencia como firmada y guardar el base64 firmado
  async markAsSynced(expedienteId: string): Promise<void> {
    await this.sqliteService.execute(
      `UPDATE urgencias_local 
       SET firmado = 1
       WHERE expediente_id = ?`,
      [expedienteId]
    );
  }

  // 🔹 Eliminar una urgencia por ID
  async deleteUrgencia(expedienteId: number): Promise<void> {
    await this.sqliteService.execute('DELETE FROM urgencias_local WHERE expediente_id = ?', [expedienteId]);
  }

  // 🔹 Limpiar toda la tabla
  async clear(): Promise<void> {
    await this.sqliteService.execute('DELETE FROM urgencias_local');
  }
}
