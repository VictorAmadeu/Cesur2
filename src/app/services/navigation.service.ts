import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from './auth.service';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private currentRouteSubject = new BehaviorSubject<string>('');
  currentRoute$ = this.currentRouteSubject.asObservable();
  private isGoingBack = false;

  constructor(
    private router: Router,
    private location: Location,
    private authService: AuthService
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRouteSubject.next(event.urlAfterRedirects);
      });
  }

  getCurrentRoute(): string {
    return this.currentRouteSubject.value;
  }

  async goBack(currentUrl?: string) {
    if (this.isGoingBack) return;
    this.isGoingBack = true;

    try {
      const url = currentUrl || this.getCurrentRoute();

      if (/^\/rutas\/[^\/]+\/[^\/]+$/.test(url)) {
        const segments = url.split('/');
        const routeId = segments[2];
        await this.router.navigate(['/rutas', routeId]);
        return;
      }

      if (/^\/rutas\/[^\/]+$/.test(url)) {
        await this.router.navigate(['/rutas']);
        return;
      }

      if (url === '/rutas') {
        try {
          await this.authService.logout();
        } catch (_e) {
          console.error('[NavigationService] Error al cerrar sesión.');
        }
        await this.router.navigate(['/login']);
        return;
      }

      this.location.back();
    } finally {
      setTimeout(() => (this.isGoingBack = false), 500);
    }
  }
}
