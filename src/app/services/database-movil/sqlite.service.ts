import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

@Injectable({
  providedIn: 'root',
})
export class SqliteService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private readonly dbName = 'db_rutas';

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async openDatabase(): Promise<void> {
    try {
      const consistency = await CapacitorSQLite.checkConnectionsConsistency({
        dbNames: [this.dbName],
        openModes: ['readwrite'],
      });

      if (consistency.result) {
        this.db = await this.sqlite.retrieveConnection(this.dbName, false);
      } else {
        this.db = await this.sqlite.createConnection(this.dbName, false, 'no-encryption', 3, false);
      }

      await this.db.open();
      await this.createTables();
    } catch (_err) {
      console.error('[SqliteService] Error abriendo la base de datos.');
      throw _err;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        roles TEXT,
        access_token TEXT,
        refresh_token TEXT,
        token_type TEXT,
        expires_in INTEGER,
        loggedAt INTEGER
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS rutas_local (
        ruta_id INTEGER PRIMARY KEY,
        ruta TEXT,
        fecha TEXT,
        cachedAt INTEGER
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS expedientes_local (
        expediente_id INTEGER PRIMARY KEY,
        ruta_id INTEGER,
        expediente TEXT,
        direccion TEXT,
        comidas INTEGER,
        orden INTEGER,
        cenas INTEGER,
        cachedAt INTEGER
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS expedientes_detalle_local (
        expediente TEXT,
        expediente_id INTEGER PRIMARY KEY,
        notas TEXT,
        comensales TEXT,
        synced INTEGER DEFAULT 0,
        cachedAt INTEGER
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS urgencias_local (
        expediente_id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo_documento_id TEXT,
        firmado INTEGER DEFAULT 0,
        firmadoBase64 TEXT,
        cachedAt INTEGER,
        synced INTEGER DEFAULT 0
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS entregas_local (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ruta_id INTEGER,
        expediente_id INTEGER,
        fecha TEXT,
        metodo TEXT,
        qrCode TEXT,
        motivo TEXT,
        observacion TEXT,
        timestamp INTEGER,
        synced INTEGER DEFAULT 0
      );
    `);

    // Garantiza compatibilidad con BDs antiguas (si la tabla ya existía sin columna fecha).
    await this.ensureEntregasFechaColumn();
  }

  private async ensureEntregasFechaColumn(): Promise<void> {
    const columns = await this.query('PRAGMA table_info(entregas_local)');
    const hasFecha = (columns || []).some((column: any) => column.name === 'fecha');

    if (!hasFecha) {
      await this.execute('ALTER TABLE entregas_local ADD COLUMN fecha TEXT');
    }

    // Rellena fecha para filas antiguas a partir del timestamp (en hora local).
    await this.execute(
      "UPDATE entregas_local SET fecha = date(timestamp / 1000, 'unixepoch', 'localtime') WHERE fecha IS NULL"
    );
  }

  get connection(): SQLiteDBConnection {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  async execute(query: string, params: any[] = []): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.run(query, params);
  }

  async query(query: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.query(query, params);
    return result.values || [];
  }

  async closeDatabase(): Promise<void> {
    try {
      const existing = await this.sqlite.isConnection(this.dbName, false);
      if (existing.result) {
        await this.sqlite.closeConnection(this.dbName, false);
        this.db = null;
      }
    } catch (_err) {
      console.error('[SqliteService] Error cerrando la base de datos.');
    }
  }

  async deleteDatabase(): Promise<void> {
    try {
      const existing = await this.sqlite.isConnection(this.dbName, false);
      if (existing.result) {
        await this.sqlite.closeConnection(this.dbName, false);
      }

      await CapacitorSQLite.deleteDatabase({ database: this.dbName });
    } catch (_err) {
      console.error('[SqliteService] Error eliminando la base de datos.');
    }
  }
}
