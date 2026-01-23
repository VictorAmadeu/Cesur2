import { Injectable } from '@angular/core';
import { EntregasRepository } from './database-movil/repositories/entregas_local.repository';
import { EntregaLocal } from '../types/entregas_local.type';
import { NetworkService } from './network.service';
import { RoutesService } from './routes.service';
import { CryptoService } from './crypto.service';
import { ExpedienteDetalleLocal } from '../types/expedientes_detalle_local.type';
import { ExpedientesRepository } from './database-movil/repositories/expedientes_detalle_local.repository';

@Injectable({
  providedIn: 'root',
})
export class DeliveredService {
  constructor(
    private entregasRepository: EntregasRepository,
    private network: NetworkService,
    private routeService: RoutesService,
    private crypto: CryptoService,
    private expedientesRepository: ExpedientesRepository
  ) {}

  async getDeliveredOrders(expediente_id: number): Promise<number[]> {
    const deliveredIds: number[] = [];
    const entrega = await this.entregasRepository.getEntregaById(expediente_id);
    if (entrega) deliveredIds.push(expediente_id);
    return deliveredIds;
  }

  async getDeliveredRoutes(ruta_id: number): Promise<number[]> {
    const deliveredIds: number[] = [];
    const entrega = await this.entregasRepository.getEntregaByRoutes(ruta_id);
    if (entrega) deliveredIds.push(ruta_id);
    return deliveredIds;
  }

  // Devuelve IDs de rutas con entregas locales (consulta bulk) y sin duplicados.
  async getDeliveredRouteIds(): Promise<number[]> {
    const ids = await this.entregasRepository.getRutaIdsWithEntregas();
    return Array.from(new Set(ids));
  }

  // Devuelve IDs de expedientes entregados para una ruta (consulta bulk) y sin duplicados.
  async getDeliveredOrderIdsByRuta(ruta_id: number): Promise<number[]> {
    const ids = await this.entregasRepository.getExpedienteIdsByRuta(ruta_id);
    return Array.from(new Set(ids));
  }

  async getSyncDeliveredOrders(): Promise<EntregaLocal[]> {
    const entregas = await this.entregasRepository.getPendingEntregas();
    return entregas;
  }

  async addDelivered(
    rutaId: number,
    expedienteId: number,
    metodo: 'NFC' | 'manual',
    motivo: string,
    observacion: string
  ) {
    const payload: EntregaLocal = {
      ruta_id: rutaId,
      expediente_id: expedienteId,
      metodo,
      motivo,
      observacion,
      timestamp: Date.now(),
      synced: 0,
    };

    await this.entregasRepository.addEntrega(payload);

    if (!this.network.isOnline) {
      return { status: 'offline', message: 'Guardado local. Se sincronizará más tarde.' };
    }

    try {
      const response = await this.routeService.deliveredOrder(String(expedienteId), motivo, observacion);
      const decrypted = await this.crypto.decryptData(response.data.data);
      const data = JSON.parse(decrypted);

      if (data.status === 'OK') {
        await this.entregasRepository.markAsSynced(expedienteId);
        return { status: 'ok', message: 'Documento enviado correctamente.' };
      } else {
        console.error('[DeliveredService] Error en respuesta API.');
        return { status: 'error', message: 'Error en el envío. Guardado localmente.' };
      }
    } catch (err) {
      console.error('[DeliveredService] Error al enviar, guardando local.');
      return { status: 'offline', message: 'Guardado local. Se sincronizará más tarde.' };
    }
  }

  async getOrderDetailSmart(expedienteId: string, dateApi: string): Promise<ExpedienteDetalleLocal | null> {
    const online = this.network.isOnline;

    if (online) {
      try {
        const response = await this.routeService.getOrderDetail(dateApi, expedienteId);
        const decrypted = await this.crypto.decryptData(response.data.data);
        const data: ExpedienteDetalleLocal = JSON.parse(decrypted);
        data.cachedAt = Date.now();

        await this.expedientesRepository.addExpediente(data);
        return data;
      } catch (err) {
        console.error('[DeliveredService] Error cargando desde API, intentando DB local.');
      }
    }

    const local = await this.expedientesRepository.getExpedienteById(Number(expedienteId));
    if (local) return local;

    return null;
  }
}
