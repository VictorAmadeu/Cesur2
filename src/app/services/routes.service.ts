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

  /**
   * Obtiene los repartos de una ruta para una fecha determinada.
   *
   * La API requiere además del identificador de la ruta un
   * parámetro `soloPendientes` para indicar si se desean únicamente
   * las entregas pendientes (`'S'`) o todas (`'N'`).
   *
   * @param fecha Fecha en formato `yyyyMMdd`.
   * @param rutaId Identificador de la ruta.
   * @param soloPendientes Indica si se devuelven sólo las entregas pendientes. Valores `'S'` o `'N'`. Por defecto `'N'`.
   */
  getDetailRoute(fecha: string, rutaId: string, soloPendientes: 'S' | 'N' = 'N') {
    const data = this.axiosService.get('/v1/rutas/repartos', {
      params: { fecha, rutaId, soloPendientes }
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
