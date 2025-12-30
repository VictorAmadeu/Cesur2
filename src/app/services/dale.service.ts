import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DateService {
  private selectedDateSubject = new BehaviorSubject<string>(this.getToday());

  selectedDate$ = this.selectedDateSubject.asObservable();

  /** Obtiene la fecha de hoy en formato yyyy-MM-dd */
  private getToday(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /** Actualiza la fecha seleccionada */
  setDate(date: string) {
    this.selectedDateSubject.next(date);
  }

  /** Devuelve la fecha actual (valor sincrónico) */
  getDate(): string {
    return this.selectedDateSubject.getValue();
  }

  /** Ir al día anterior */
  previousDay() {
    const date = new Date(this.getDate());
    date.setDate(date.getDate() - 1);
    this.setDate(date.toISOString().slice(0, 10));
  }

  /** Ir al día siguiente */
  nextDay() {
    const date = new Date(this.getDate());
    date.setDate(date.getDate() + 1);
    this.setDate(date.toISOString().slice(0, 10));
  }

  /**Método para API */
  getDateApiFormat(): string {
    return this.selectedDateSubject.getValue().replace(/-/g, '');
  }
}
