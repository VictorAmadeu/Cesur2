import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CryptoService } from 'src/app/services/crypto.service';
import { RoutesService } from 'src/app/services/routes.service';
import {
  IonButton,
  IonInput,
  IonTextarea,
  IonItem,
  IonLabel,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonIcon,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-delivery',
  templateUrl: './modal-delivery.component.html',
  styleUrls: ['./modal-delivery.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonInput,
    IonTextarea,
    IonItem,
    IonLabel,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonIcon,
    IonSelect,
    IonSelectOption,
  ],
})
export class ModalDeliveryComponent implements OnInit {
  @Input() expedienteId!: string;

  observaciones: string = '';
  motivos: Array<{ motivo_id: string; motivo: string }> = [];
  selectedMotivo: string = '';

  constructor(
    private routesService: RoutesService,
    private cryptoService: CryptoService,
    private modalCtrl: ModalController
  ) {}

  async ngOnInit() {
    await this.getMotives();
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    const payload = {
      expedienteId: this.expedienteId || '',
      motivo: this.selectedMotivo,
      observaciones: this.observaciones || '',
    };
    this.modalCtrl.dismiss(payload, 'confirm');
  }

  async getMotives() {
    try {
      const req = await this.routesService.getMotives();
      const decrypted = await this.cryptoService.decryptData(req.data.data);
      this.motivos = JSON.parse(decrypted);
    } catch (error: any) {
      console.error('[ModalDeliveryComponent] Error al obtener motivos:', { message: error?.message });
      this.motivos = [];
    }
  }
}
