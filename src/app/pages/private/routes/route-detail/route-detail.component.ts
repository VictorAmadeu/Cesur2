import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RoutesService } from 'src/app/services/routes.service';
import { CommonModule } from '@angular/common';
import { IonContent, IonItem } from '@ionic/angular/standalone';
import { LoadingComponent } from 'src/app/components/loading/loading.component';
import { AppLauncher } from '@capacitor/app-launcher';
import { CryptoService } from 'src/app/services/crypto.service';
import { DeliveredOrder } from 'src/app/services/database-movil/models/delivered-order.model';
import { DateService } from 'src/app/services/dale.service';
import { ExpedienteApi, ExpedienteLocal } from 'src/app/types/expedientes_local.type';
import { Network } from '@capacitor/network';
import { ExpedienteLocalRepository } from 'src/app/services/database-movil/repositories/expedientes_local.repository';
import { EntregasRepository } from 'src/app/services/database-movil/repositories/entregas_local.repository';
import { DeliveredService } from 'src/app/services/delivered-service.service';
import { RouteHeaderService } from 'src/app/services/route-header.service';
import { ExpedienteDetalleLocal } from 'src/app/types/expedientes_detalle_local.type';

@Component({
  selector: 'app-route-detail',
  templateUrl: './route-detail.component.html',
  styleUrls: ['./route-detail.component.scss'],
  imports: [CommonModule, RouterModule, IonContent, IonItem, LoadingComponent],
})
export class RouteDetailComponent implements OnInit {
  routeId!: string;
  routeData: ExpedienteApi[] = [];
  routes: any[] = [];
  loading: Boolean = true;
  deliveredOrderTrace: number[] = [];
  date: string = '';

  constructor(
    private route: ActivatedRoute,
    private routesService: RoutesService,
    private router: Router,
    private headerService: RouteHeaderService,
    private cryptoService: CryptoService,
    private dateService: DateService,
    private expedienteLocalRepository: ExpedienteLocalRepository,
    private deliveredService: DeliveredService
  ) { }

  async ngOnInit() {
    this.routeId = this.route.snapshot.paramMap.get('id')!;
  }

  ionViewWillEnter() {
    this.loadRouteDetail();
  }

  async loadRouteDetail() {
    this.loading = true;
    this.dateService.setDate('2024-08-29');
    this.date = this.dateService.getDate();

    const dateApi = this.dateService.getDateApiFormat();

    // Evita que quede un contador antiguo en el header si esta pantalla falla o recarga
    this.headerService.clearSubtitleProgress();

    try {
      let expedientesLocal: ExpedienteLocal[] = [];

      const response = await this.routesService.getDetailRoute(dateApi, this.routeId);
      const decrypted = await this.cryptoService.decryptData(response.data.data);
      const cachedAt = Date.now();

      expedientesLocal = (JSON.parse(decrypted) as ExpedienteLocal[]).map(r => ({
        ...r,
        fecha: this.date,
        ruta_id: Number(this.routeId),
        cachedAt,
      }));

      expedientesLocal.sort((a, b) => a.orden - b.orden);

      const totalEntregas = expedientesLocal.length;
      this.headerService.setSubtitleTwo(`${totalEntregas} Entregas`);

      this.deliveredOrderTrace = [];
      for (const exp of expedientesLocal) {
        const entregados = await this.deliveredService.getDeliveredOrders(Number(exp.expediente_id));
        if (entregados && entregados.length > 0) {
          this.deliveredOrderTrace.push(...entregados);
        }
      }

      this.deliveredOrderTrace = Array.from(new Set(this.deliveredOrderTrace));

      if (totalEntregas > 0) {
        const entregadas = Math.min(this.deliveredOrderTrace.length, totalEntregas);
        this.headerService.setSubtitleProgress(`${entregadas} de ${totalEntregas} entregas`);
      } else {
        this.headerService.clearSubtitleProgress();
      }

      this.routeData = expedientesLocal;
    } catch (err) {
      console.error('Error al cargar detalle de ruta:', err);
      this.headerService.clearSubtitleProgress();
    } finally {
      this.loading = false;
    }
  }

  async onClick(item: ExpedienteApi, address: string) {

    if (!this.canOpen(item)) return;

    const expedienteId = item.expediente_id;

    const routeId = this.route.snapshot.paramMap.get('id');

    this.headerService.setSubtitle(address);

    this.router.navigate(
      ['/privado/rutas', routeId, expedienteId]
    );
  }

  isNextToDeliver(item: ExpedienteApi): boolean {
    if (this.deliveredOrderTrace.includes(item.expediente_id)) return false;

    const firstPending = this.routeData.find(rd => !this.deliveredOrderTrace.includes(rd.expediente_id));
    return firstPending?.expediente_id === item.expediente_id;
  }

  isDelivered(item: ExpedienteApi): boolean {
    return this.deliveredOrderTrace.some(d => d === item.expediente_id);
  }

  canOpen(item: ExpedienteApi): boolean {
    return this.isDelivered(item) || this.isNextToDeliver(item);
  }

}
