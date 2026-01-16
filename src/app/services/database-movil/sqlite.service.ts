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

  /**
   * Inicializa la base de datos asegurando que no haya conexiones duplicadas.
   */
  async openDatabase(): Promise<void> {
    try {
      console.log('🔹 Inicializando base de datos...');

      // 1. Comprobar consistencia de conexiones
      const consistency = await CapacitorSQLite.checkConnectionsConsistency({
        dbNames: [this.dbName],
        openModes: ['readwrite']
      });
      console.log('checkConnectionsConsistency:', consistency);


      if (consistency.result) {
        console.log('⚠️ Recuperando conexión existente...');
        this.db = await this.sqlite.retrieveConnection(this.dbName, false);
      } else {
        console.log('🔹 Creando nueva conexión...');
        this.db = await this.sqlite.createConnection(
          this.dbName,
          false,
          'no-encryption',
          3,
          false
        );
      }

      // 3. Abrir la conexión
      await this.db.open();
      console.log('✅ Base de datos abierta correctamente.');

      // 4. Crear tablas si no existen
      await this.createTables();
      console.log('✅ DB lista y tablas creadas correctamente');

    } catch (err) {
      console.error('❌ Error abriendo la DB', err);
      throw err;
    }
  }

  /**
   * Crea las tablas necesarias si no existen.
   */
  private async createTables(): Promise<void> {
    if (!this.db) return;

    // 1️⃣ Usuarios
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


    // 2️⃣ Rutas del día
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS rutas_local (
        ruta_id INTEGER PRIMARY KEY,
        ruta TEXT,
        fecha TEXT,
        cachedAt INTEGER
      );
    `);


    // 3️⃣ Expedientes de la ruta
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

    // 2️⃣ Crear la tabla nueva
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

    // 5️⃣ Urgencias (PDF a firmar)
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

    // 6️⃣ Entregas locales
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS entregas_local (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ruta_id INTEGER,
        expediente_id INTEGER,
        metodo TEXT,
        qrCode TEXT,
        motivo TEXT,
        observacion TEXT,
        timestamp INTEGER,
        synced INTEGER DEFAULT 0
      );
    `);
  }

  /**
   * Devuelve la conexión activa o lanza error si no está lista.
   */
  get connection(): SQLiteDBConnection {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Ejecuta un query sin retorno (INSERT, UPDATE, DELETE).
   */
  async execute(query: string, params: any[] = []): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.run(query, params);
  }

  /**
   * Ejecuta un SELECT y retorna resultados.
   */
  async query(query: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.query(query, params);
    return result.values || [];
  }

  /**
   * Cierra la conexión manualmente (opcional, útil en logout o reset).
   */
  async closeDatabase(): Promise<void> {
    try {
      const existing = await this.sqlite.isConnection(this.dbName, false);
      if (existing.result) {
        await this.sqlite.closeConnection(this.dbName, false);
        this.db = null;
        console.log('🔹 Conexión cerrada correctamente');
      }
    } catch (err) {
      console.error('❌ Error cerrando la DB', err);
    }
  }

  async deleteDatabase(): Promise<void> {
    try {
      // Verificar si existe conexión antes de intentar cerrarla
      const existing = await this.sqlite.isConnection(this.dbName, false);
      if (existing.result) {
        console.log('🔹 Cerrando conexión antes de eliminar...');
        await this.sqlite.closeConnection(this.dbName, false);
      }

      // Ahora eliminar la DB
      await CapacitorSQLite.deleteDatabase({ database: this.dbName });
      console.log('🗑️ Base de datos eliminada correctamente');
    } catch (err) {
      console.warn('⚠️ No se pudo eliminar la base de datos (posiblemente no existe todavía):', err);
    }
  }

}
