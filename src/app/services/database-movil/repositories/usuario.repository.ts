import { Injectable } from '@angular/core';
import { SqliteService } from '../sqlite.service';
import { Usuario } from 'src/app/types/usuario.type';

@Injectable({
  providedIn: 'root',
})
export class UsuarioRepository {
  constructor(private sqlite: SqliteService) {}

  async init(): Promise<void> {
    await this.sqlite.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
        username TEXT PRIMARY KEY,
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
    const query = `
      INSERT OR REPLACE INTO usuarios 
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
  }

  async getUsuario(): Promise<Usuario | null> {
    const rows = await this.sqlite.query(`SELECT * FROM usuarios LIMIT 1`);
    if (!rows.length) return null;

    const row = rows[0];
    return {
      username: row.username,
      roles: JSON.parse(row.roles || '[]'),
      access_token: row.access_token,
      refresh_token: row.refresh_token,
      token_type: row.token_type,
      expires_in: row.expires_in,
      loggedAt: row.loggedAt,
    } as Usuario;
  }

  async deleteUsuario(): Promise<void> {
    await this.sqlite.execute(`DELETE FROM usuarios`);
  }

  async clear(): Promise<void> {
    const query = `DELETE FROM usuarios`;
    await this.sqlite.execute(query);
  }
}
