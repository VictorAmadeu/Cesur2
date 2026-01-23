import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonItem,
  IonList,
  IonLabel,
  IonCard,
  IonIcon,
  IonFab,
  IonFabButton,
} from '@ionic/angular/standalone';
import { LoadingComponent } from 'src/app/components/loading/loading.component';
import { ToastService } from 'src/app/services/toast.service';
import { CryptoService } from 'src/app/services/crypto.service';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { ModalController } from '@ionic/angular';
import { ModalDeliveryComponent } from 'src/app/components/modal-delivery/modal-delivery.component';
import { ModalActionEnum } from 'src/app/enum/modal-action.enum';
import { FormsModule } from '@angular/forms';
import { ModalFileComponent } from 'src/app/components/modal-file/modal-file.component';
import { DateService } from 'src/app/services/dale.service';
import { Network } from '@capacitor/network';
import { UrgenciasRepository } from 'src/app/services/database-movil/repositories/urgencias_local.repository';
import { EntregasRepository } from 'src/app/services/database-movil/repositories/entregas_local.repository';
import { DeliveredService } from 'src/app/services/delivered-service.service';
import { RouteHeaderService } from 'src/app/services/route-header.service';
import { RoutesService } from 'src/app/services/routes.service';
import { AppLauncher } from '@capacitor/app-launcher';
import { register } from 'swiper/element/bundle';

register();

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
  imports: [
    FormsModule,
    CommonModule,
    IonContent,
    IonItem,
    IonList,
    IonLabel,
    LoadingComponent,
    IonCard,
    IonIcon,
    IonFab,
    IonFabButton,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class OrderDetailComponent implements OnInit {
  routeId!: string;
  routeData: any;
  loading: Boolean = true;
  orderId: string = '';
  isDelivered: Boolean = false;
  resultQr: string | null = null;
  fabOpen = false;
  qrSupported = false;

  /**
   * isEmergency NO es solo un icono: también controla la lógica del documento en el FAB
   * (y la validación antes de entregar). Se calcula SOLO desde comidaEmergencia.
   */
  isEmergency: Boolean = false;

  /**
   * Icono del encabezado (UI) con prioridad y regla:
   * - Riesgo social => NO mostrar icono (null)
   * - Emergencia => icono emergencia
   * - Cumple con azúcar => icono cumple con azúcar
   * - Cumple sin azúcar => icono cumple sin azúcar
   */
  headerIconSrc: string | null = null;

  ModalActionEnum = ModalActionEnum;
  date: string = '';

  /**
   * Si no hay registro en urgencias_local (0 filas), debe ser false explícito
   * para no dejar estado anterior.
   */
  documentDevlivered: boolean = false;

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
    private urgenciasRepository: UrgenciasRepository,
    private deliveredService: DeliveredService
  ) {}

  async ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('expediente')!;
    this.routeId = this.route.snapshot.paramMap.get('id')!;
    this.qrSupported = await this.checkQrSupport();
  }

  ionViewWillEnter() {
    this.headerService.clearSubtitleProgress();
    this.loadRouteDetail();
  }

  async loadRouteDetail() {
    this.loading = true;
    this.date = this.dateService.getDate();

    const dateApi = this.dateService.getDateApiFormat();

    // Mantener comprobación por si se usa, sin loguear datos
    await Network.getStatus();

    try {
      const data = await this.deliveredService.getOrderDetailSmart(this.orderId, dateApi);
      this.routeData = data;

      if (this.routeData) {
        this.headerService.setSubtitle(this.routeData.direccion ?? '');
        this.headerService.setSubtitleTwo(this.routeData.expediente ?? '');

        this.updateDeliveryFlagsAndHeaderIcon();

        const entregado = await this.deliveredService.getDeliveredOrders(this.routeData.expediente_id);
        this.isDelivered = entregado.length > 0;

        await this.checkDocument();
      }
    } catch (err) {
      console.error('Error al cargar detalle de ruta:', err);
    } finally {
      this.loading = false;
    }
  }

  private updateDeliveryFlagsAndHeaderIcon(): void {
    const comensales = this.routeData?.comensales ?? [];

    const hasSocialRisk = comensales.some((c: any) => this.isTruthyFlag(c?.riesgoSocial));
    const hasEmergency = comensales.some((c: any) => this.isTruthyFlag(c?.comidaEmergencia));
    const hasBirthdaySugar = comensales.some((c: any) => this.isTruthyFlag(c?.cumpleanosConAzucar));
    const hasBirthdayNoSugar = comensales.some((c: any) => this.isTruthyFlag(c?.cumpleanosSinAzucar));

    this.isEmergency = hasEmergency;

    this.headerIconSrc = this.getHeaderIconSrc({
      hasSocialRisk,
      hasEmergency,
      hasBirthdaySugar,
      hasBirthdayNoSugar,
    });
  }

  private isTruthyFlag(value: unknown): boolean {
    if (value === true) return true;
    if (value === false || value === null || value === undefined) return false;

    const str = String(value).trim().toUpperCase();
    return str === 'S' || str === 'SI' || str === 'TRUE' || str === '1';
  }

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

      // Si es emergencia, debe existir firma antes de permitir entrega
      if (this.isEmergency) {
        const urgenciaLocal = await this.urgenciasRepository.getUrgenciaById(Number(expedienteId));
        if (!urgenciaLocal?.firmado) {
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
        this.toastService.show('Documento enviado correctamente.', 'success');
      } else if (req.status === 'offline') {
        this.toastService.show(req.message, 'warning');
      } else {
        this.toastService.show(req.message, 'danger');
      }
    } catch (error: any) {
      console.error('Error al entregar la orden:', error);
    }
  }

  async onClickQr() {
    try {
      if (!this.qrSupported) {
        this.toastService.show('Escaneo QR no disponible en este dispositivo.', 'warning');
        return;
      }

      const hasPermission = await this.ensureQrPermissions();
      if (!hasPermission) {
        this.toastService.show('Permiso de cámara requerido para escanear.', 'warning');
        return;
      }

      const result = await BarcodeScanner.scan();

      if (result.barcodes.length > 0) {
        const value = result.barcodes[0].rawValue ?? '';
        this.resultQr = value;

        const id = value.split('/').pop()?.trim();
        if (!id) {
          this.toastService.show('QR inválido.', 'danger');
          return;
        }

        const req = await this.routesService.checkOrderByQr(id);
        const decrypted = await this.cryptoService.decryptData(req.data.data);
        JSON.parse(decrypted); // Validación de formato sin loguear contenido

        this.toastService.show('QR escaneado con éxito.', 'success');
      } else {
        this.toastService.show('No se detectó ningún QR.', 'danger');
      }
    } catch (err) {
      this.toastService.show('Error al escanear.', 'danger');
    }
  }

  async openMap() {
    const address = this.routeData?.direccion;
    if (!address) {
      this.toastService.show('No hay dirección disponible.', 'warning');
      return;
    }
    await AppLauncher.openUrl({ url: `geo:0,0?q=${encodeURIComponent(address)}` });
  }

  private async checkQrSupport(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      const { supported } = await BarcodeScanner.isSupported();
      return supported;
    } catch (err) {
      console.error('QR no soportado en esta plataforma:', err);
      return false;
    }
  }

  private async ensureQrPermissions(): Promise<boolean> {
    try {
      const { camera } = await BarcodeScanner.checkPermissions();
      if (camera === 'granted') return true;

      const request = await BarcodeScanner.requestPermissions();
      return request.camera === 'granted';
    } catch (err) {
      console.error('Error al pedir permisos de cámara:', err);
      return false;
    }
  }

  async checkDocument() {
    // Si no hay fila (0 resultados), Boolean(undefined) => false (estado explícito)
    const urgencia = await this.urgenciasRepository.getUrgenciaById(Number(this.routeData.expediente_id));
    this.documentDevlivered = Boolean(urgencia?.firmado);
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

    const { role } = await modal.onWillDismiss();
    if (role === 'confirm') {
      await this.loadRouteDetail();
    }
  }
}
