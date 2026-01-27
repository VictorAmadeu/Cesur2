import { Component, OnInit, OnDestroy } from '@angular/core';
import { RoutesService } from 'src/app/services/routes.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DatePickerComponent } from 'src/app/components/datePicker/date-picker.component';
import { IonContent, IonItem } from '@ionic/angular/standalone';
import { LoadingComponent } from 'src/app/components/loading/loading.component';
import { CryptoService } from 'src/app/services/crypto.service';
import { RutaLocal } from 'src/app/types/rutas_local.type';

import { DateService } from 'src/app/services/dale.service';
import { DeliveredService } from 'src/app/services/delivered-service.service';
import { RouteHeaderService } from 'src/app/services/route-header.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-routes',
  templateUrl: './routes.component.html',
  styleUrls: ['./routes.component.scss'],
  imports: [RouterModule, CommonModule, DatePickerComponent, IonContent, IonItem, LoadingComponent],
  standalone: true,
})
export class RoutesComponent implements OnInit, OnDestroy {
  routes: any[] = [];
  loading: Boolean = true;
  date: string = '';
  deliveredOrderTrace: number[] = [];

  // Suscripción al observable de fecha del DateService para liberar en ngOnDestroy.
  private dateSub?: Subscription;

  constructor(
    private routesService: RoutesService,
    private router: Router,
    private headerService: RouteHeaderService,
    private cryptoService: CryptoService,
    private dateService: DateService,
    private deliveredService: DeliveredService
  ) {}

  async ngOnInit() {
    this.date = this.dateService.getDate();

    this.dateSub = this.dateService.selectedDate$.subscribe(date => {
      if (date === this.date) return; // Evita recargar si no cambia la fecha.
      this.date = date;
      this.loadRouteDetail();
    });
  }

  ionViewWillEnter() {
    this.loadRouteDetail();
  }

  ngOnDestroy() {
    this.dateSub?.unsubscribe();
  }

  async loadRouteDetail() {
    this.loading = true;
    this.headerService.clearAll();

    this.date = this.dateService.getDate();
    const dateApi = this.dateService.getDateApiFormat();

    try {
      const response = await this.routesService.getRoutes(dateApi);
      const decrypted = await this.cryptoService.decryptData(response.data.data);
      const cachedAt = Date.now();

      const rutas = (JSON.parse(decrypted) as RutaLocal[]).map(r => ({
        ...r,
        fecha: this.date,
        cachedAt,
      }));

      this.routes = rutas ?? [];

      // Bulk: una sola consulta local (evita llamar por cada ruta).
      const currentRouteIds = new Set((rutas ?? []).map(r => Number(r.ruta_id)));
      const deliveredRoutes = await this.deliveredService.getDeliveredRouteIds();

      // Solo marcamos como entregadas las rutas que están en pantalla para esta fecha.
      this.deliveredOrderTrace = deliveredRoutes.filter(id => currentRouteIds.has(id));
    } catch (error) {
      console.error('Error al cargar rutas:', error);
    } finally {
      this.loading = false;
    }
  }

  onClick(routeName: string, id: string) {
    this.headerService.setHeader(routeName);
    this.headerService.setSubtitle(this.dateService.getDate());  // ← Obtiene la fecha actual del servicio
    this.router.navigate(['/privado/rutas', id]);
  }
}
