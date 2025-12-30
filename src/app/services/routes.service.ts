import { Injectable } from '@angular/core';
import { AxiosService } from './axios.service';
import { UrgenciaLocal } from '../types/urgencias_local.type';

@Injectable({
  providedIn: 'root',
})
export class RoutesService {
  constructor(private axiosService: AxiosService) {}

  getRoutes(fecha: string) {
    const data = this.axiosService.get('/v1/rutas/disponibles', {
      params: { fecha }
    });
    return data;
  }

  getDetailRoute(fecha: string, rutaId: string) {
    const data = this.axiosService.get('/v1/rutas/repartos', {
      params: { fecha, rutaId }
    });

    return data;
  }

  getOrderDetail(fecha: string, expedienteId: string) {
    const data = this.axiosService.get('/v1/rutas/entregas', {
      params: { fecha, expedienteId }
    });

    return data;
  }

  deliveredOrder(expedienteId: string, motivo: string = "", observaciones: string = "") {
    return this.axiosService.post('v1/entregas/entregar', {
      expedienteId,
      motivo,
      observaciones,
    });
  }

  checkOrderByQr(qrId: string) {
    return this.axiosService.get(`v1/entregas/expediente?qr=${qrId}`);
  } 

  getMotives(){
    return this.axiosService.get('v1/entregas/motivos');
  }

  postPdf(urgencia: UrgenciaLocal) {
      return this.axiosService.post('v1/entregas/entregar', {
        expedienteId: urgencia.expediente_id,
        tipoDocumentoId: urgencia.tipo_documento_id,
        nombre: `documento_${urgencia.expediente_id}_firmado`,
        fichero: urgencia.firmadoBase64
      });
    }

  getTypes(){
    return this.axiosService.get('v1/documentos/tipos');
  }
}
