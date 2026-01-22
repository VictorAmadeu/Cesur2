import { Component, OnInit, OnDestroy } from '@angular/core';
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
  hasDeliveries: any[] = [];
  date: string = '';
  deliveredOrderTrace: number[] = [];
  /**
   * Suscripción al observable de fecha del DateService. Se guarda
   * para poder liberarla correctamente en ngOnDestroy.
   */
  private dateSub?: Subscription;

  constructor(
    private routesService: RoutesService,
    private router: Router,
    private headerService: RouteHeaderService,
    private cryptoService: CryptoService,
    private rutaLocalRepo: RutaLocalRepository,
    private dateService: DateService,
    private deliveredService: DeliveredService
  ) { }

  /**
   * Inicializa la fecha actual y suscribe a los cambios de fecha. Cada vez
   * que la fecha seleccionada cambia, se vuelve a cargar el listado de rutas.
   */
  async ngOnInit() {
    // Obtenemos la fecha inicial almacenada en el servicio.
    this.date = this.dateService.getDate();
    // Nos suscribimos a los cambios de fecha. Si la fecha cambia,
    // actualizamos el valor local y recargamos las rutas.
    this.dateSub = this.dateService.selectedDate$.subscribe(date => {
      // Si la fecha es la misma no recargamos para evitar peticiones innecesarias.
      if (date === this.date) return;
      this.date = date;
      this.loadRouteDetail();
    });
  }

  /**
   * Al destruir el componente cancelamos la suscripción para evitar fugas de memoria.
   */
  ngOnDestroy() {
    this.dateSub?.unsubscribe();
  }

  ionViewWillEnter() {
    this.loadRouteDetail();
  }

  async loadRouteDetail() {
    this.loading = true;
    this.headerService.clearAll();
    // Obtenemos la fecha actual sin forzarla a ningún valor fijo.
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
