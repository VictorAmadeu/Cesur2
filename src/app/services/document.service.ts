import { Injectable } from '@angular/core';
import { RoutesService } from './routes.service';
import { NetworkService } from './network.service';
import { CryptoService } from './crypto.service';
import { UrgenciasRepository } from './database-movil/repositories/urgencias_local.repository';
import { UrgenciaLocal } from '../types/urgencias_local.type';

@Injectable({ providedIn: 'root' })
export class DocumentosService {
  constructor(
    private routesService: RoutesService,
    private network: NetworkService,
    private crypto: CryptoService,
    private urgenciasRepository: UrgenciasRepository
  ) {}

  /**
   * Envía un documento firmado, o lo guarda localmente si no hay conexión
   */
  async subirDocumentoFirmado(expedienteId: string, tipoDocumentoId: string, firmado: boolean, firmadoBase63: string) {
    const payload: UrgenciaLocal = {
      expediente_id: parseInt(expedienteId),
      tipo_documento_id: tipoDocumentoId,
      firmado: firmado,
      firmadoBase64: firmadoBase63,
      synced: 0
    };

    // ✅ Siempre guardamos localmente primero
    await this.urgenciasRepository.upsertUrgencia(payload);

    if (!this.network.isOnline) {
      console.log('[DocumentosService] Sin conexión, guardado local pendiente.');
      return { status: 'offline', message: 'Guardado local. Se sincronizará más tarde.' };
    }

    try {
      const response = await this.routesService.postPdf(payload);
      const decrypted = await this.crypto.decryptData(response.data.data);
      const data = JSON.parse(decrypted);

      if (data.status === 'OK') {
        // Marcar como sincronizado
        await this.urgenciasRepository.markAsSynced(expedienteId);
        return { status: 'ok', message: 'Documento enviado correctamente.' };
      } else {
        console.warn('[DocumentosService] Error en respuesta API:', data);
        return { status: 'error', message: 'Error en el envío. Guardado localmente.' };
      }
    } catch (err) {
      console.error('[DocumentosService] Error al enviar, guardando local.', err);
      return { status: 'offline', message: 'Guardado local. Se sincronizará más tarde.' };
    }
  }

  async getSyncDocuments(): Promise<UrgenciaLocal[]> {
      const urgencias = await this.urgenciasRepository.getPendingUrgencias();
      return urgencias;
  }
}
