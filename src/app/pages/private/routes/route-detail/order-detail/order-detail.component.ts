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
import { DeliveredService } from 'src/app/services/delivered-service.service';
import { RouteHeaderService } from 'src/app/services/route-header.service';
import { AppLauncher } from '@capacitor/app-launcher';
import { register } from 'swiper/element/bundle';
import { NfcService } from 'src/app/services/nfc.service';

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
  loading: boolean = true;
  orderId: string = '';
  isDelivered: boolean = false;
  resultQr: string | null = null;
  fabOpen = false;

  qrSupported = false;
  nfcSupported = false;
  nfcBusy = false;

  private pendingQrCode: string | null = null;

  private readonly QR_PARAM_KEYS = [
    'expediente',
    'expedienteId',
    'expediente_id',
    'id',
    'codigo',
    'codigoExpediente',
    // claves de comensal en QR (query / JSON)
    'comensal',
    'comensalId',
    'comensal_id',
    'idComensal',
    'codigoComensal',
  ];

  // Posibles claves de comensal dentro de routeData.comensales[]
  private readonly COMENSAL_FIELD_KEYS = [
    'comensal_id',
    'comensalId',
    'idComensal',
    'codigoComensal',
    'comensal',
    'id',
  ];

  /**
   * isEmergency NO es solo un icono: controla la lógica del documento en el FAB
   * (y la validación antes de entregar). Se calcula SOLO desde comidaEmergencia.
   */
  isEmergency: boolean = false;

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
    private headerService: RouteHeaderService,
    private toastService: ToastService,
    private dateService: DateService,
    private urgenciasRepository: UrgenciasRepository,
    private deliveredService: DeliveredService,
    private nfcService: NfcService
  ) {}

  async ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('expediente')!;
    this.routeId = this.route.snapshot.paramMap.get('id')!;
    this.qrSupported = await this.checkQrSupport();
    this.nfcSupported = await this.nfcService.isSupported();
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

  async delivered(
    expedienteId: string,
    motivo?: string,
    observaciones?: string,
    metodo: 'NFC' | 'manual' = 'manual',
    qrCode?: string
  ) {
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
        metodo,
        motivo,
        observaciones,
        qrCode
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
      this.pendingQrCode = null;

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

      if (result.barcodes.length === 0) {
        this.toastService.show('No se detectó ningún QR.', 'danger');
        return;
      }

      const rawValue = (result.barcodes[0].rawValue ?? '').trim();
      if (!rawValue) {
        this.toastService.show('QR inválido.', 'danger');
        return;
      }

      if (!this.routeData?.expediente_id) {
        this.toastService.show('No hay expediente cargado para validar el QR.', 'warning');
        return;
      }

      const tokens = this.extractQrTokens(rawValue);
      if (!this.tokensMatchCurrentOrder(tokens)) {
        this.toastService.show('QR no corresponde a este expediente.', 'danger');
        return;
      }

      this.resultQr = rawValue;
      this.pendingQrCode = rawValue;

      this.toastService.show('Lectura correcta. Completa el motivo para entregar.', 'success');
      await this.openModalQr();
    } catch (err) {
      this.toastService.show('Error al escanear.', 'danger');
    }
  }

  async onClickNfc() {
    if (!this.nfcSupported) {
      this.toastService.show('NFC no disponible en este dispositivo.', 'warning');
      return;
    }

    if (this.nfcBusy) {
      this.toastService.show('Lectura NFC en curso.', 'warning');
      return;
    }

    if (!this.routeData?.expediente_id) {
      this.toastService.show('No hay expediente cargado para validar NFC.', 'warning');
      return;
    }

    this.pendingQrCode = null;
    this.nfcBusy = true;

    try {
      const payload = await this.nfcService.readOnce(20000);

      const tokens = this.extractQrTokens(payload);
      if (!this.tokensMatchCurrentOrder(tokens)) {
        this.toastService.show('NFC no corresponde a este expediente.', 'danger');
        return;
      }

      this.resultQr = payload;
      this.pendingQrCode = payload;

      this.toastService.show('Lectura NFC correcta. Completa el motivo para entregar.', 'success');
      await this.openModalQr();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al leer NFC.';
      this.toastService.show(message, 'danger');
    } finally {
      this.nfcBusy = false;
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

  private normalizeQrToken(value: string): string {
    return value.trim().toUpperCase();
  }

  private cleanQrToken(value: string): string {
    return value.replace(/^[^A-Za-z0-9_-]+|[^A-Za-z0-9_-]+$/g, '').trim();
  }

  private safeDecodeURIComponent(value: string): string {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  private extractTokensFromJson(value: unknown, addToken: (value: unknown) => void): void {
    if (value === null || value === undefined) return;

    if (Array.isArray(value)) {
      value.forEach(item => this.extractTokensFromJson(item, addToken));
      return;
    }

    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      for (const key of this.QR_PARAM_KEYS) {
        if (key in obj) {
          this.extractTokensFromJson(obj[key], addToken);
        }
      }
      return;
    }

    addToken(value);
  }

  private extractQrTokens(rawValue: string): string[] {
    const raw = (rawValue ?? '').trim();
    if (!raw) return [];

    const tokens = new Set<string>();
    const addToken = (value: unknown) => {
      if (value === null || value === undefined) return;
      const str = this.cleanQrToken(String(value));
      if (str) tokens.add(str);
    };

    const decoded = this.safeDecodeURIComponent(raw);
    const candidates = decoded !== raw ? [raw, decoded] : [raw];

    for (const candidate of candidates) {
      // JSON
      if (candidate.startsWith('{') || candidate.startsWith('[')) {
        try {
          const parsed = JSON.parse(candidate);
          this.extractTokensFromJson(parsed, addToken);
        } catch {
          // ignorar JSON inválido
        }
      }

      // URL
      if (candidate.includes('://')) {
        try {
          const url = new URL(candidate);
          url.pathname.split('/').forEach(segment => addToken(segment));
          for (const key of this.QR_PARAM_KEYS) {
            const value = url.searchParams.get(key);
            if (value) addToken(value);
          }
        } catch {
          // ignorar URLs inválidas
        }
      }

      // separador genérico
      candidate.split(/[\/?#&=:\s]+/).forEach(part => addToken(part));
    }

    return Array.from(tokens);
  }

  private getExpectedQrTokens(): string[] {
    const tokens: string[] = [];

    if (this.routeData?.expediente) {
      tokens.push(String(this.routeData.expediente));
    }

    if (this.routeData?.expediente_id !== undefined && this.routeData?.expediente_id !== null) {
      tokens.push(String(this.routeData.expediente_id));
    }

    if (this.orderId) {
      tokens.push(String(this.orderId));
    }

    return tokens.map(token => token.trim()).filter(Boolean);
  }

  private getExpectedComensalTokens(): string[] {
    const comensales = this.routeData?.comensales ?? [];
    const tokens: string[] = [];

    for (const item of comensales) {
      if (!item || typeof item !== 'object') continue;
      const comensal = item as Record<string, unknown>;

      for (const key of this.COMENSAL_FIELD_KEYS) {
        if (key in comensal) {
          const value = comensal[key];
          if (value !== null && value !== undefined && String(value).trim() !== '') {
            tokens.push(String(value));
          }
        }
      }
    }

    return tokens.map(token => token.trim()).filter(Boolean);
  }

  private hasTokenMatch(tokens: string[], expectedTokens: string[]): boolean {
    if (!tokens.length || !expectedTokens.length) return false;
    const expectedSet = new Set(expectedTokens.map(t => this.normalizeQrToken(t)));
    return tokens.some(token => expectedSet.has(this.normalizeQrToken(token)));
  }

  private tokensMatchCurrentOrder(tokens: string[]): boolean {
    if (this.hasTokenMatch(tokens, this.getExpectedQrTokens())) return true;

    const comensalTokens = this.getExpectedComensalTokens();
    return this.hasTokenMatch(tokens, comensalTokens);
  }

  async checkDocument() {
    const urgencia = await this.urgenciasRepository.getUrgenciaById(Number(this.routeData.expediente_id));
    this.documentDevlivered = Boolean(urgencia?.firmado);
  }

  async openModal() {
    if (!this.routeData?.expediente_id) {
      this.toastService.show('No hay expediente cargado.', 'warning');
      return;
    }

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
      await this.delivered(this.routeData.expediente_id, data?.motivo, data?.observaciones);
    }

    await this.loadRouteDetail();
  }

  async openModalQr() {
    if (!this.routeData?.expediente_id) {
      this.toastService.show('No hay expediente cargado.', 'warning');
      return;
    }

    const modal = await this.modalController.create({
      component: ModalDeliveryComponent,
      backdropDismiss: false,
      componentProps: {
        expedienteId: this.routeData.expediente_id,
        expedienteReadonly: true,
        title: 'Entrega por QR/NFC',
      },
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm') {
      await this.delivered(
        this.routeData.expediente_id,
        data?.motivo,
        data?.observaciones,
        'NFC',
        this.pendingQrCode ?? undefined
      );
    }

    this.pendingQrCode = null;
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
