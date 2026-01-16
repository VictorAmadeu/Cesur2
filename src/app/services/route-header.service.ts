import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface HeaderInfo {
  title?: string;
  subtitle?: string;
  subtitleTwo?: string;

  // Línea adicional opcional para mostrar progreso (ej: "2 de 43 entregas")
  subtitleProgress?: string;
}

@Injectable({ providedIn: 'root' })
export class RouteHeaderService {
  private headerSubject = new BehaviorSubject<HeaderInfo>({});
  header$ = this.headerSubject.asObservable();

  /** Setea el title y el subtitle */
  setHeader(title: string, subtitle?: string) {
    this.headerSubject.next({ title, subtitle });
  }

  /** Solo actualiza el subtitle */
  setSubtitle(subtitle: string) {
    const current = this.headerSubject.value;
    this.headerSubject.next({ ...current, subtitle });
  }

  /** Limpia únicamente el subtitle */
  clearSubtitle() {
    const current = this.headerSubject.value;
    this.headerSubject.next({ ...current, subtitle: undefined });
  }

  /** Limpia únicamente el title */
  clearTitle() {
    const current = this.headerSubject.value;
    this.headerSubject.next({ ...current, title: undefined });
  }

  setSubtitleTwo(subtitleTwo: string) {
    const current = this.headerSubject.value;
    this.headerSubject.next({ ...current, subtitleTwo });
  }

  clearSubtitleTwo() {
    const current = this.headerSubject.value;
    this.headerSubject.next({ ...current, subtitleTwo: undefined });
  }

  /** Actualiza la línea de progreso */
  setSubtitleProgress(subtitleProgress: string) {
    const current = this.headerSubject.value;
    this.headerSubject.next({ ...current, subtitleProgress });
  }

  /** Limpia únicamente la línea de progreso */
  clearSubtitleProgress() {
    const current = this.headerSubject.value;
    this.headerSubject.next({ ...current, subtitleProgress: undefined });
  }

  /** Limpia todo */
  clearAll() {
    this.headerSubject.next({});
  }
}
