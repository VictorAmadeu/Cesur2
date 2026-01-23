import { Injectable } from '@angular/core';
import { SqliteService } from '../sqlite.service';
import { Usuario } from 'src/app/types/usuario.type';

@Injectable({
  providedIn: 'root',
})
export class UsuarioRepository {
  // Cache en memoria para evitar SELECT repetidos (por ejemplo, en cada decrypt)
  private cachedUser: Usuario | null = null;

  // Evita múltiples SELECT concurrentes: todas las llamadas esperan el mismo Promise
  private inFlight: Promise<Usuario | null> | null = null;

  constructor(private sqlite: SqliteService) {}

  async init(): Promise<void> {
    await this.sqlite.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        roles TEXT,
        access_token TEXT,
        refresh_token TEXT,
        token_type TEXT,
        expires_in INTEGER,
        loggedAt INTEGER
      )
    `);
  }

  async saveUsuario(usuario: Usuario): Promise<void> {
    // En esta app no necesitamos histórico de usuarios: dejamos solo el último
    await this.sqlite.execute(`DELETE FROM usuarios`);

    const query = `
      INSERT INTO usuarios 
        (username, roles, access_token, refresh_token, token_type, expires_in, loggedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await this.sqlite.execute(query, [
      usuario.username,
      JSON.stringify(usuario.roles || []),
      usuario.access_token,
      usuario.refresh_token,
      usuario.token_type,
      usuario.expires_in,
      usuario.loggedAt,
    ]);

    this.cachedUser = usuario;
    this.inFlight = null;
  }

  async getUsuario(): Promise<Usuario | null> {
    if (this.cachedUser) return this.cachedUser;
    if (this.inFlight) return this.inFlight;

    const promise = (async () => {
      const rows = await this.sqlite.query(`
        SELECT username, roles, access_token, refresh_token, token_type, expires_in, loggedAt
        FROM usuarios
        ORDER BY loggedAt DESC
        LIMIT 1
      `);

      if (!rows.length) return null;

      const row = rows[0];
      const user = {
        username: row.username,
        roles: JSON.parse(row.roles || '[]'),
        access_token: row.access_token,
        refresh_token: row.refresh_token,
        token_type: row.token_type,
        expires_in: row.expires_in,
        loggedAt: row.loggedAt,
      } as Usuario;

      this.cachedUser = user;
      return user;
    })();

    this.inFlight = promise;

    try {
      return await promise;
    } finally {
      if (this.inFlight === promise) this.inFlight = null;
    }
  }

  async deleteUsuario(): Promise<void> {
    await this.sqlite.execute(`DELETE FROM usuarios`);
    this.cachedUser = null;
    this.inFlight = null;
  }

  async clear(): Promise<void> {
    await this.deleteUsuario();
  }
}
