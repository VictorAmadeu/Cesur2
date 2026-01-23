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
   * Envía un documento firmado, o lo guarda localmente si no hay conexión.
   */
  async subirDocumentoFirmado(
    expedienteId: string,
    tipoDocumentoId: string,
    firmado: boolean,
    firmadoBase64: string
  ) {
    const expedienteIdNumber = Number(expedienteId);

    const payload: UrgenciaLocal = {
      expediente_id: expedienteIdNumber,
      tipo_documento_id: tipoDocumentoId,
      firmado,
      firmadoBase64,
      synced: 0,
    };

    // Guardamos localmente primero (offline-first)
    await this.urgenciasRepository.upsertUrgencia(payload);

    if (!this.network.isOnline) {
      return { status: 'offline', message: 'Guardado local. Se sincronizará más tarde.' };
    }

    try {
      const response = await this.routesService.postPdf(payload);
      const decrypted = await this.crypto.decryptData(response.data.data);
      const data = JSON.parse(decrypted);

      if (data.status === 'OK') {
        // markAsSynced está tipado para recibir string en este repo; pasamos el expedienteId original.
        await this.urgenciasRepository.markAsSynced(expedienteId);
        return { status: 'ok', message: 'Documento enviado correctamente.' };
      } else {
        console.error('[DocumentosService] Error en respuesta API.');
        return { status: 'error', message: 'Error en el envío. Guardado localmente.' };
      }
    } catch (err) {
      console.error('[DocumentosService] Error al enviar, guardando local.');
      return { status: 'offline', message: 'Guardado local. Se sincronizará más tarde.' };
    }
  }

  async getSyncDocuments(): Promise<UrgenciaLocal[]> {
    const urgencias = await this.urgenciasRepository.getPendingUrgencias();
    return urgencias;
  }
}
