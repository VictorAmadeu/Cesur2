import { Injectable } from '@angular/core';
import CryptoJS from 'crypto-js';
import { environment } from 'src/environments/environment';
import { UsuarioRepository } from './database-movil/repositories/usuario.repository';

@Injectable({
  providedIn: 'root',
})
export class CryptoService {
  constructor(private usuarioRepo: UsuarioRepository) {}

  private formatKeyOrIV(value: string, len = 16): string {
    if (value.length > len) return value.substring(0, len);
    return value.padEnd(len, '$');
  }

  /**
   * Desencripta los datos de la API usando username de la DB y apiSecret del environment
   */
  async decryptData(encryptedBase64: string): Promise<string> {
    const user = await this.usuarioRepo.getUsuario();

    if (!user) throw new Error('No se encontró usuario para decrypt');

    const username = user.username;
    const apiSecret = environment.apiSecret;

    const key = CryptoJS.enc.Utf8.parse(this.formatKeyOrIV(username));
    const iv = CryptoJS.enc.Utf8.parse(this.formatKeyOrIV(apiSecret));

    const encryptedBytes = CryptoJS.enc.Base64.parse(encryptedBase64);
    const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext: encryptedBytes });

    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}
