import { Component, OnInit } from '@angular/core';
import { RoutesService } from 'src/app/services/routes.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DatePickerComponent } from 'src/app/components/datePicker/date-picker.component';
import { IonContent, IonItem } from '@ionic/angular/standalone';
import { LoadingComponent } from 'src/app/components/loading/loading.component';
import { CryptoService } from 'src/app/services/crypto.service';
import { RutaLocal } from 'src/app/types/rutas_local.type';
import { RutaLocalRepository } from 'src/app/services/database-movil/repositories/rutas_local.repository';

import { Network } from '@capacitor/network';
import { DateService } from 'src/app/services/dale.service';
import { DeliveredService } from 'src/app/services/delivered-service.service';
import { RouteHeaderService } from 'src/app/services/route-header.service';

@Component({
  selector: 'app-routes',
  templateUrl: './routes.component.html',
  styleUrls: ['./routes.component.scss'],
  imports: [RouterModule, CommonModule, DatePickerComponent, IonContent, IonItem, LoadingComponent],
  standalone: true,
})
export class RoutesComponent implements OnInit {
  routes: any[] = [];
  loading: Boolean = true;
  hasDeliveries: any[] = [];
  date: string = '';
  deliveredOrderTrace: number[] = [];

  constructor(
    private routesService: RoutesService,
    private router: Router,
    private headerService: RouteHeaderService,
    private cryptoService: CryptoService,
    private rutaLocalRepo: RutaLocalRepository,
    private dateService: DateService,
    private deliveredService: DeliveredService
  ) { }

  async ngOnInit() { }

  ionViewWillEnter() {
    this.loadRouteDetail();
  }

  async loadRouteDetail() {
    this.loading = true;
    this.headerService.clearAll();
    this.dateService.setDate('2024-08-29');
    this.date = this.dateService.getDate();
    const dateApi = this.dateService.getDateApiFormat();


    try {
      let rutas: RutaLocal[] = [];

      const response = await this.routesService.getRoutes(dateApi);
      const decrypted = await this.cryptoService.decryptData(response.data.data);
      const cachedAt = Date.now();

      rutas = (JSON.parse(decrypted) as RutaLocal[]).map(r => ({
        ...r,
        fecha: this.date,
        cachedAt,
      }));

      this.routes = rutas ?? [];

      this.deliveredOrderTrace = [];
      for (const exp of rutas) {
        const entregado = (await this.deliveredService.getDeliveredRoutes(Number(exp.ruta_id))) || [];
        if (entregado.length > 0) {
          this.deliveredOrderTrace.push(...entregado);
        }
      }

      this.deliveredOrderTrace = Array.from(new Set(this.deliveredOrderTrace));
    } catch (error) {
      console.error('Error al cargar rutas:', error);
    } finally {
      this.loading = false;
    }
  }

  onClick(routeName: string, id: string) {
    this.headerService.setHeader(routeName);
    this.headerService.setSubtitle(this.date);
    this.router.navigate(['/privado/rutas', id]);
  }

}
