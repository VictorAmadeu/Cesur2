import { Injectable } from '@angular/core';
import { SqliteService } from '../sqlite.service';
import { ExpedienteLocal } from 'src/app/types/expedientes_local.type';

@Injectable({
  providedIn: 'root',
})
export class ExpedienteLocalRepository {
  constructor(private sqliteService: SqliteService) {}

  /**
   * Inserta o reemplaza un expediente en la tabla local
   */
  async save(expediente: ExpedienteLocal): Promise<void> {
    const query = `
      INSERT OR REPLACE INTO expedientes_local 
      (expediente_id, ruta_id, expediente, direccion, orden, comidas, cenas, cachedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await this.sqliteService.execute(query, [
      expediente.expediente_id,
      expediente.ruta_id,
      expediente.expediente,
      expediente.direccion,
      expediente.orden,
      expediente.comidas,
      expediente.cenas,
      expediente.cachedAt,
    ]);
  }

  /**
   * Guarda varios expedientes en batch
   */
  async saveAll(expedientes: ExpedienteLocal[]): Promise<void> {
    for (const exp of expedientes) {
      await this.save(exp);
    }
  }

  /**
   * Obtiene todos los expedientes de una ruta
   */
  async findByRuta(rutaId: number): Promise<ExpedienteLocal[]> {
    const query = `
      SELECT * FROM expedientes_local
      WHERE ruta_id = ?
      ORDER BY orden ASC
    `;
    const result = await this.sqliteService.query(query, [rutaId]);

    // Convierte el iterador en array
    const rows = Array.from(result.values()) as ExpedienteLocal[];
    return rows;
  }


  /**
   * Obtiene un expediente por su ID
   */
  async findById(expedienteId: number): Promise<ExpedienteLocal | null> {
    const query = `
      SELECT * FROM expedientes_local
      WHERE expediente_id = ?
    `;
    const result = await this.sqliteService.query(query, [expedienteId]);
    if (result.values && result.values.length > 0) {
      return result.values[0] as ExpedienteLocal;
    }
    return null;
  }

  /**
   * Elimina un expediente por ID
   */
  async delete(expedienteId: number): Promise<void> {
    const query = `DELETE FROM expedientes_local WHERE expediente_id = ?`;
    await this.sqliteService.execute(query, [expedienteId]);
  }

  /**
   * Limpia toda la tabla de expedientes
   */
  async clear(): Promise<void> {
    const query = `DELETE FROM expedientes_local`;
    await this.sqliteService.execute(query);
  }
}
