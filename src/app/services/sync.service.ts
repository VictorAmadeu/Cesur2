import { Injectable } from '@angular/core';
import { Network } from '@capacitor/network';
import { SqliteService } from './database-movil/sqlite.service';
import { DeliveredService } from './delivered-service.service';
import { Subscription } from 'rxjs';
import { NetworkService } from './network.service';
import { DocumentosService } from './document.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class SyncService {
  private isSyncing = false;
  private networkSub?: Subscription;

  constructor(
    private db: SqliteService,
    private deliveredService: DeliveredService,
    private documentosService: DocumentosService,
    private network: NetworkService,
    private toastService: ToastService
  ) {}

  async init() {
    this.toastService.show('[SYNC] Inicializando servicio de sincronización...', 'warning');

    if (this.network.isOnline) {
      await this.syncAll();
    }

    // Suscríbete al estado de red
    this.networkSub = this.network.isOnline$.subscribe(async (online) => {
      if (online) {
        this.toastService.show('[SYNC] Se detectó reconexión. Iniciando sincronización...', 'warning');
        await this.syncAll();
      } else {
        this.toastService.show('[SYNC] Sin conexión. Esperando reconexión...', 'warning');
      }
    });
  }

  async syncAll() {
    if (this.isSyncing) {
      this.toastService.show('[SYNC] Ya hay una sincronización en curso.', 'warning');
      return;
    }

    this.isSyncing = true;
    this.toastService.show('[SYNC] Iniciando sincronización general...', 'warning');

    try {
      await this.documents();
      await this.delivered();
    } catch (error) {
      this.toastService.show('[SYNC] Error durante la sincronización:', 'danger');
    } finally {
      this.isSyncing = false;
      this.toastService.show('[SYNC] Sincronización finalizada.', 'warning');
    }
  }

  private async delivered() {
    const unsyncedDocs = await this.deliveredService.getSyncDeliveredOrders();
    this.toastService.show(`[SYNC] Pendientes: ${unsyncedDocs}`, 'info');
  }

  private async documents() {
    const unsyncedDocs = await this.documentosService.getSyncDocuments();
    this.toastService.show(`[SYNC] Documentos pendientes: ${unsyncedDocs}`, 'info');
  }
}
