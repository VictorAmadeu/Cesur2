import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DateService {
  private selectedDateSubject = new BehaviorSubject<string>(this.getToday());

  selectedDate$ = this.selectedDateSubject.asObservable();

  private formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseLocalDate(dateStr: string): Date {
    const clean = (dateStr || '').split('T')[0];
    const parts = clean.split('-').map(Number);
    if (parts.length !== 3 || parts.some(part => !Number.isFinite(part))) {
      return new Date();
    }
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
  }

  /** Obtiene la fecha de hoy en formato yyyy-MM-dd (zona local) */
  private getToday(): string {
    return this.formatLocalDate(new Date());
  }

  /** Actualiza la fecha seleccionada normalizando a YYYY-MM-DD */
  setDate(date: string | null | undefined) {
    const normalized = this.formatLocalDate(this.parseLocalDate(date ?? this.getToday()));
    this.selectedDateSubject.next(normalized);
  }

  /** Devuelve la fecha actual (valor sincronico) */
  getDate(): string {
    return this.selectedDateSubject.getValue();
  }

  /** Ir al dia anterior */
  previousDay() {
    const date = this.parseLocalDate(this.getDate());
    date.setDate(date.getDate() - 1);
    this.setDate(this.formatLocalDate(date));
  }

  /** Ir al dia siguiente */
  nextDay() {
    const date = this.parseLocalDate(this.getDate());
    date.setDate(date.getDate() + 1);
    this.setDate(this.formatLocalDate(date));
  }

  /** Metodo para API (yyyyMMdd) */
  getDateApiFormat(): string {
    const normalized = this.formatLocalDate(this.parseLocalDate(this.getDate()));
    return normalized.replace(/-/g, '');
  }
}
