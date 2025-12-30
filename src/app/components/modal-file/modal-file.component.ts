import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SafeResourceUrl } from '@angular/platform-browser';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonIcon,
      IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption
} from '@ionic/angular/standalone';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileViewer } from '@capacitor/file-viewer';
import { PDFDocument } from 'pdf-lib';
import SignaturePad from 'signature_pad';
import { RoutesService } from 'src/app/services/routes.service';
import { UrgenciasRepository } from 'src/app/services/database-movil/repositories/urgencias_local.repository';
import { ToastService } from 'src/app/services/toast.service';
import { CryptoService } from 'src/app/services/crypto.service';
import { ModalController } from '@ionic/angular'; // <-- import
import { DocumentosService } from 'src/app/services/document.service';
import { UrgenciaLocal } from 'src/app/types/urgencias_local.type';
import { LoadingComponent } from '../loading/loading.component';

export interface FilesystemWriteFileResult {
  uri: string;
}

@Component({
  selector: 'app-modal-file',
  templateUrl: './modal-file.component.html',
  styleUrls: ['./modal-file.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonIcon,
    CommonModule,
    FormsModule,
    IonButton,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    LoadingComponent
  ]
})
export class ModalFileComponent implements OnInit {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  @Input() expedienteId!: string;

  showPdf = false;
  pdfUrl!: SafeResourceUrl;
  base64File: string | null = null;
  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  signaturePad!: SignaturePad;
  showPdfSigned: boolean = false;
  resultPdfSinged: FilesystemWriteFileResult | undefined;
  types: Array<{ tipo_documento_id: string, tipo_documento: string }> = [];
  selectType: string = '';
  loading: boolean = false;

  constructor(private documentosService: DocumentosService, private modalCtrl: ModalController, private routesService: RoutesService, private urgenciasRepository: UrgenciasRepository, private cryptoService: CryptoService, private toastService: ToastService) { }

  async ngOnInit() {
    this.getTypes();
  }

  async getTypes() {
    this.loading = true;
    const req = await this.routesService.getTypes();
    const decrypted = await this.cryptoService.decryptData(req.data.data);
    this.types = JSON.parse(decrypted);
    console.log(JSON.parse(decrypted))
    this.loading = false;
  }

  selectFile() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.base64File = (reader.result as string).split(',')[1]; // solo base64, sin el encabezado data:
      console.log("Archivo en base64:", this.base64File.substring(0, 100) + "..."); // muestra un preview
    };
    reader.onerror = (err) => {
      console.error("Error leyendo archivo:", err);
    };
    reader.readAsDataURL(file);
  }

  async verPDF() {
    try {
      const fileName = `archivo_${Date.now()}.pdf`;

      if (this.base64File) {
        // Guardar el PDF en el sistema de archivos
        const result = await Filesystem.writeFile({
          path: fileName,
          data: this.base64File,
          directory: Directory.Cache,
        });

        // Abrir el PDF con el visor nativo
        await FileViewer.openDocumentFromLocalPath({
          path: result.uri,
        });
      } else {
        console.error('No hay archivo PDF para mostrar.');
      }
    } catch (err) {
      console.error('Error abriendo PDF:', err);
    }
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {

    const payload = {
    };

    this.modalCtrl.dismiss(payload, 'confirm');
  }

  //FIRMA DIGITAL
  ngAfterViewInit() {
    this.signaturePad = new SignaturePad(this.canvas.nativeElement, {
      backgroundColor: 'rgb(255,255,255)',
      penColor: 'black'
    });
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const canvas = this.canvas.nativeElement;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = 300 * ratio; // ancho fijo
    canvas.height = 300 * ratio; // altura fija
    canvas.getContext('2d')!.scale(ratio, ratio);
    this.signaturePad.clear();
  }

  clear() {
    this.signaturePad.clear();
  }

  getSignature(): string | null {
    if (this.signaturePad.isEmpty()) return null;
    return this.signaturePad.toDataURL(); // base64 de la firma
  }

  async firmarPDF() {
    this.loading = true;
    try {
      if(this.selectType === '') {
        this.toastService.show("Debe seleccionar un tipo de documento", "danger")
        return;
      }
  
      if (!this.base64File) {
        console.error('No hay PDF para firmar.');
        return;
      }
  
      // Obtener la firma en base64 desde el canvas
      const signatureDataUrl = this.getSignature();
      if (!signatureDataUrl) {
        console.error('No hay firma dibujada.');
        return;
      }
  
      // Cargar el PDF existente
      const pdfDoc = await PDFDocument.load(this.base64File, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
  
      // Convertir la firma a bytes
      const pngBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer());
      const pngImage = await pdfDoc.embedPng(pngBytes);
  
      // Tamaño de la página
      const { width, height } = firstPage.getSize();
  
      // Insertar la firma en la parte inferior derecha
      firstPage.drawImage(pngImage, {
        x: width - 200,   // ajustar horizontal
        y: 50,            // ajustar vertical
        width: 150,       // ancho de la firma
        height: 50        // alto de la firma
      });
  
      const pdfBytes = await pdfDoc.save();
      const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
  
      const req = await this.documentosService.subirDocumentoFirmado(
        this.expedienteId,
        this.selectType,
        true,
        pdfBase64,
      );
  
      if (req.status === 'ok') {
        this.toastService.show("PDF firmado correctamente", "success")
      } else if(req.status === 'offline') {
        this.toastService.show(req.message, "warning")
      } else{
        this.toastService.show(req.message, "danger")
      }
  
      this.confirm();
    } catch (error) {
      console.error('Error firmando PDF:', error);
    }finally {
      this.loading = false;
    }
  }

}
