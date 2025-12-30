import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoutesService } from 'src/app/services/routes.service';
import { CommonModule } from '@angular/common';
import { IonContent, IonItem, IonList, IonLabel, IonCard, IonIcon, IonFab, IonFabButton } from '@ionic/angular/standalone';
import { LoadingComponent } from 'src/app/components/loading/loading.component';
import { ToastService } from 'src/app/services/toast.service';
import { CryptoService } from 'src/app/services/crypto.service';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { ModalController } from '@ionic/angular';
import { ModalDeliveryComponent } from 'src/app/components/modal-delivery/modal-delivery.component';
import { ModalActionEnum } from 'src/app/enum/modal-action.enum';
import { FormsModule } from '@angular/forms';
import { ModalFileComponent } from 'src/app/components/modal-file/modal-file.component';
import { ExpedientesRepository } from 'src/app/services/database-movil/repositories/expedientes_detalle_local.repository';
import { DateService } from 'src/app/services/dale.service';
import { Network } from '@capacitor/network';
import { ExpedienteDetalleLocal } from 'src/app/types/expedientes_detalle_local.type';
import { UrgenciasRepository } from 'src/app/services/database-movil/repositories/urgencias_local.repository';
import { UrgenciaLocal } from 'src/app/types/urgencias_local.type';
import { EntregasRepository } from 'src/app/services/database-movil/repositories/entregas_local.repository';
import { DeliveredService } from 'src/app/services/delivered-service.service';
import { RouteHeaderService } from 'src/app/services/route-header.service';
import { ExpedienteApi } from 'src/app/types/expedientes_local.type';
import { AppLauncher } from '@capacitor/app-launcher';
import { register } from 'swiper/element/bundle';

register();

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
  imports: [FormsModule, CommonModule, IonContent, IonItem, IonList, IonLabel, LoadingComponent, IonCard, IonIcon, IonFab, IonFabButton],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class OrderDetailComponent implements OnInit {
  routeId!: string;
  routeData: any;
  routes: any[] = [];
  loading: Boolean = true;
  orderId: string = '';
  isDelivered: Boolean = false;
  resultQr: string | null = null;
  fabOpen = false;

  /**
   *  IMPORTANTE (producción):
   * isEmergency NO es solo un icono: también controla la lógica del documento en el FAB (y la validación antes de entregar).
   * Por eso lo dejamos como flag funcional y lo calculamos SOLO desde comidaEmergencia.
   */
  isEmergency: Boolean = false;

  /**
   * Icono del encabezado (UI): se calcula con prioridad y con la regla:
   * - Riesgo social => NO mostrar icono (null)
   * - Emergencia => icono emergencia
   * - Cumple con azúcar => icono cumple con azúcar
   * - Cumple sin azúcar => icono cumple sin azúcar
   */
  headerIconSrc: string | null = null;

  ModalActionEnum = ModalActionEnum;
  date: string = '';
  documentDevlivered: boolean = false;

  // Rutas reales de los iconos (src/assets/icon/entregas)
  private readonly ICON_EMERGENCIA = 'assets/icon/entregas/ico-emergencia.png';
  private readonly ICON_CUMPLE_CON_AZUCAR = 'assets/icon/entregas/ico-cumpleanos-con.png';
  private readonly ICON_CUMPLE_SIN_AZUCAR = 'assets/icon/entregas/ico-cumpleanos-sin.png';

  constructor(
    private modalController: ModalController,
    private route: ActivatedRoute,
    private routesService: RoutesService,
    private headerService: RouteHeaderService,
    private toastService: ToastService,
    private entregasRepository: EntregasRepository,
    private cryptoService: CryptoService,
    private dateService: DateService,
    private expedientesRepository: ExpedientesRepository,
    private urgenciasRepository: UrgenciasRepository,
    private deliveredService: DeliveredService,
  ) { }

  async ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('expediente')!;
    this.routeId = this.route.snapshot.paramMap.get('id')!;
    this.dateService.setDate('2024-08-29');
  }

  ionViewWillEnter() {
    // Cada vez que la página entra en pantalla, recargamos todo
    this.loadRouteDetail();
  }

  async loadRouteDetail() {
    this.loading = true;
    this.date = this.dateService.getDate();

    const dateApi = this.dateService.getDateApiFormat();

    // Nota: mantenemos la comprobación de red por si se usa en el futuro,
    // pero NO la guardamos en una variable sin uso para no generar warnings/errores.
    await Network.getStatus();

    try {
      const data = await this.deliveredService.getOrderDetailSmart(this.orderId, dateApi);
      this.routeData = data;

      if (this.routeData) {
        this.headerService.setSubtitle(this.routeData.direccion ?? "");
        this.headerService.setSubtitleTwo(this.routeData.expediente ?? "");
        console.log("Expediente:", this.routeData);

        // Punto clave: calculamos flags y el icono del encabezado en base a TODOS los comensales.
        this.updateDeliveryFlagsAndHeaderIcon();

        const entregado = await this.deliveredService.getDeliveredOrders(this.routeData.expediente_id);
        if (entregado.length > 0) {
          this.isDelivered = true;
        }

        this.checkDocument();
      }
    } catch (err) {
      console.error('Error al cargar detalle de ruta:', err);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Calcula:
   * - isEmergency: SOLO desde comidaEmergencia (afecta lógica de documento/FAB)
   * - headerIconSrc: icono del encabezado según prioridad y regla de riesgo social
   */
  private updateDeliveryFlagsAndHeaderIcon(): void {
    const comensales = this.routeData?.comensales ?? [];

    // Regla: se evalúa sobre TODOS los comensales (no solo el primero)
    const hasSocialRisk = comensales.some((c: any) => this.isTruthyFlag(c?.riesgoSocial));
    const hasEmergency = comensales.some((c: any) => this.isTruthyFlag(c?.comidaEmergencia));
    const hasBirthdaySugar = comensales.some((c: any) => this.isTruthyFlag(c?.cumpleanosConAzucar));
    const hasBirthdayNoSugar = comensales.some((c: any) => this.isTruthyFlag(c?.cumpleanosSinAzucar));

    // Flag funcional (NO tocar su significado): solo emergencia real
    this.isEmergency = hasEmergency;

    // Icono del encabezado (UI) con prioridad; riesgo social => sin icono
    this.headerIconSrc = this.getHeaderIconSrc({
      hasSocialRisk,
      hasEmergency,
      hasBirthdaySugar,
      hasBirthdayNoSugar,
    });
  }

  /**
   * Normaliza valores que vienen de API para flags tipo "S"/"N".
   * Lo hacemos robusto sin inventar estructura nueva: aceptamos también boolean/number.
   */
  private isTruthyFlag(value: unknown): boolean {
    if (value === true) return true;
    if (value === false || value === null || value === undefined) return false;

    const str = String(value).trim().toUpperCase();
    return str === 'S' || str === 'SI' || str === 'TRUE' || str === '1';
  }

  /**
   * Regla de negocio para iconos del encabezado:
   * - Riesgo social => NO icono
   * - Emergencia > Cumple con azúcar > Cumple sin azúcar
   */
  private getHeaderIconSrc(flags: {
    hasSocialRisk: boolean;
    hasEmergency: boolean;
    hasBirthdaySugar: boolean;
    hasBirthdayNoSugar: boolean;
  }): string | null {
    if (flags.hasSocialRisk) return null;
    if (flags.hasEmergency) return this.ICON_EMERGENCIA;
    if (flags.hasBirthdaySugar) return this.ICON_CUMPLE_CON_AZUCAR;
    if (flags.hasBirthdayNoSugar) return this.ICON_CUMPLE_SIN_AZUCAR;
    return null;
  }

  async delivered(expedienteId: string, motivo?: string, observaciones?: string) {
    try {
      if (!expedienteId || !motivo || !observaciones) {
        this.toastService.show('Completar todos los campos antes de realizar la entrega.', 'danger');
        return;
      }

      // Importante: esta lógica depende de isEmergency (por eso lo calculamos SOLO desde comidaEmergencia)
      if (this.isEmergency) {
        const expedienteDetalleLocal = await this.urgenciasRepository.getUrgenciaById(Number(expedienteId)); // --> te dice si firmo el documento

        if (!expedienteDetalleLocal?.firmado) {
          this.toastService.show('Debe firmar el documento antes de realizar la entrega.', 'danger');
          return;
        }
      }

      const req = await this.deliveredService.addDelivered(
        Number(this.routeId),
        Number(expedienteId),
        'manual',
        motivo,
        observaciones
      );

      if (req.status === 'ok') {
        this.toastService.show("PDF firmado correctamente", "success");
      } else if (req.status === 'offline') {
        this.toastService.show(req.message, "warning");
      } else {
        this.toastService.show(req.message, "danger");
      }

    } catch (error: any) {
      console.error('Error al entregar la orden:', error);
    }
  }

  async onClickQr() {
    try {
      const result = await BarcodeScanner.scan();

      if (result.barcodes.length > 0) {
        const value = result.barcodes[0].rawValue ?? '';
        this.resultQr = value;

        const id = value.split('/').pop();

        console.log('QR escaneado:', id);

        if (id) {
          const req = await this.routesService.checkOrderByQr(id);
          console.log("req", req);
          const decrypted = await this.cryptoService.decryptData(req.data.data);
          const responseJson = JSON.parse(decrypted);
          console.log("responseJson", responseJson);
        }

        this.toastService.show('QR escaneado con exito.', 'success');
      } else {
        this.toastService.show('No se detectó ningún QR', 'danger');
      }
    } catch (err) {
      this.toastService.show('Error al escanear', 'danger');
    }
  }

  async openMap() {
    await AppLauncher.openUrl({ url: `geo:0,0?q=${encodeURIComponent(this.routeData.direccion)}` });
  }

  async checkDocument() {
    const documentDelivered = await this.urgenciasRepository.getUrgenciaById(this.routeData.expediente_id);
    console.log(documentDelivered);

    if (documentDelivered) {
      this.documentDevlivered = true;
    }
  }

  ngOnDestroy() {
    this.routeId = this.route.snapshot.paramMap.get('fecha')!;
    this.headerService.setSubtitle('29/08/2024');
  }

  async openModal() {
    const modal = await this.modalController.create({
      component: ModalDeliveryComponent,
      backdropDismiss: false,
      componentProps: {
        expedienteId: this.routeData.expediente_id,
      },
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm') {
      await this.delivered(this.routeData.expediente_id, data.motivo, data.observaciones);
    }

    console.log("finalizado");

    await this.loadRouteDetail();
  }

  async openModalFile() {
    const modal = await this.modalController.create({
      component: ModalFileComponent,
      backdropDismiss: false,
      componentProps: {
        expedienteId: this.routeData.expediente_id,
      },
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm') {
      await this.loadRouteDetail();
    }
  }

}
