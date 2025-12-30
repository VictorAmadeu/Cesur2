import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface HeaderInfo {
  title?: string;
  subtitle?: string;
  subtitleTwo?: string;
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

  /** Limpia todo */
  clearAll() {
    this.headerSubject.next({});
  }
}
