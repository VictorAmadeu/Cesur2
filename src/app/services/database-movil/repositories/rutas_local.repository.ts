import { Injectable } from '@angular/core';
import { SqliteService } from '../sqlite.service';
import { RutaLocal } from 'src/app/types/rutas_local.type';

@Injectable({
  providedIn: 'root',
})
export class RutaLocalRepository {
  constructor(private sqliteService: SqliteService) {}

  /**
   * Inserta o reemplaza una ruta en la DB
   */
  async saveRutaLocal(route: RutaLocal): Promise<void> {
    const query = `
      INSERT OR REPLACE INTO rutas_local (ruta_id, ruta, fecha, cachedAt)
      VALUES (?, ?, ?, ?)
    `;
    await this.sqliteService.execute(query, [
      route.ruta_id,
      route.ruta,
      route.fecha,
      route.cachedAt,
    ]);
  }

  /**
   * Inserta múltiples rutas en la DB
   */
  async saveAll(routes: RutaLocal[]): Promise<void> {
    for (const route of routes) {
      await this.saveRutaLocal(route);
    }
  }

  /**
   * Obtiene todas las rutas locales
   */
  async getAll(): Promise<RutaLocal[]> {
    const query = `SELECT * FROM rutas_local`;
    const result = await this.sqliteService.query(query);
    return result as RutaLocal[];
  }

  /**
   * Obtiene rutas locales de una fecha específica
   */
  async getByDate(fecha: string): Promise<RutaLocal[]> {
    const query = `SELECT * FROM rutas_local WHERE fecha = ? ORDER BY ruta_id`;
    const result = await this.sqliteService.query(query, [fecha]);
    return result as RutaLocal[];
  }

  /**
   * Elimina todas las rutas locales
   */
  async clear(): Promise<void> {
    const query = `DELETE FROM rutas_local`;
    await this.sqliteService.execute(query);
  }

  /**
   * Elimina rutas por fecha
   */
  async deleteByDate(fecha: string): Promise<void> {
    const query = `DELETE FROM rutas_local WHERE fecha = ?`;
    await this.sqliteService.execute(query, [fecha]);
  }
}
