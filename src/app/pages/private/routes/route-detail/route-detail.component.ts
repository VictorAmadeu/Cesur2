import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RoutesService } from 'src/app/services/routes.service';
import { CommonModule } from '@angular/common';
import { IonContent, IonItem } from '@ionic/angular/standalone';
import { LoadingComponent } from 'src/app/components/loading/loading.component';
import { CryptoService } from 'src/app/services/crypto.service';
import { DateService } from 'src/app/services/dale.service';
import { ExpedienteApi, ExpedienteLocal } from 'src/app/types/expedientes_local.type';
import { DeliveredService } from 'src/app/services/delivered-service.service';
import { RouteHeaderService } from 'src/app/services/route-header.service';

@Component({
  selector: 'app-route-detail',
  templateUrl: './route-detail.component.html',
  styleUrls: ['./route-detail.component.scss'],
  imports: [CommonModule, RouterModule, IonContent, IonItem, LoadingComponent],
})
export class RouteDetailComponent implements OnInit {
  routeId!: string;
  routeData: ExpedienteApi[] = [];
  loading: Boolean = true;
  deliveredOrderTrace: number[] = [];
  date: string = '';
  private useBackendOrder = false;

  constructor(
    private route: ActivatedRoute,
    private routesService: RoutesService,
    private router: Router,
    private headerService: RouteHeaderService,
    private cryptoService: CryptoService,
    private dateService: DateService,
    private deliveredService: DeliveredService
  ) {}

  async ngOnInit() {
    this.routeId = this.route.snapshot.paramMap.get('id')!;
  }

  ionViewWillEnter() {
    this.loadRouteDetail();
  }

  async loadRouteDetail() {
    this.loading = true;
    this.useBackendOrder = false;

    this.date = this.dateService.getDate();
    this.headerService.setSubtitle(this.date);

    const dateApi = this.dateService.getDateApiFormat();

    this.headerService.clearSubtitleProgress();

    try {
      const soloPendientes: 'S' | 'N' = 'N';
      const response = await this.routesService.getDetailRoute(dateApi, this.routeId, soloPendientes);
      const decrypted = await this.cryptoService.decryptData(response.data.data);
      const cachedAt = Date.now();

      const expedientesLocal = (JSON.parse(decrypted) as ExpedienteLocal[]).map(r => ({
        ...r,
        fecha: this.date,
        ruta_id: Number(this.routeId),
        cachedAt,
      }));

      expedientesLocal.sort((a, b) => a.orden - b.orden);

      this.useBackendOrder = this.isValidOrderList(expedientesLocal);

      const totalEntregas = expedientesLocal.length;
      this.headerService.setSubtitleTwo(`${totalEntregas} Entregas`);

      const rutaIdNumber = Number(this.routeId);
      if (Number.isFinite(rutaIdNumber)) {
        this.deliveredOrderTrace = await this.deliveredService.getDeliveredOrderIdsByRuta(rutaIdNumber);
      } else {
        this.deliveredOrderTrace = [];
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

    this.router.navigate(['/privado/rutas', routeId, expedienteId]);
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

  getDisplayOrder(item: ExpedienteApi, index: number): number {
    if (!this.useBackendOrder) return index + 1;

    const order = Number(item.orden);
    return Number.isFinite(order) && order > 0 ? order : index + 1;
  }

  private isValidOrderList(list: ExpedienteLocal[]): boolean {
    if (!list || list.length === 0) return false;

    const orders = list.map(item => Number(item.orden));
    if (orders.some(order => !Number.isFinite(order) || order <= 0)) return false;

    const unique = new Set(orders);
    if (unique.size !== orders.length) return false;

    const sorted = [...orders].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i += 1) {
      if (sorted[i] !== i + 1) return false;
    }

    return true;
  }
}
