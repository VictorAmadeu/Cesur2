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
    private authService: AuthService,
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRouteSubject.next(event.urlAfterRedirects);
        console.log('NavigationService detectó cambio de ruta:', event.urlAfterRedirects);
      });
  }

  getCurrentRoute(): string {
    return this.currentRouteSubject.value;
  }

  async goBack(currentUrl?: string) {
    console.log('Iniciando navegacion:', currentUrl);
    if (this.isGoingBack) {
      return; // evitar ejecución múltiple
    }
    this.isGoingBack = true;

    try {
      const url = currentUrl || this.getCurrentRoute();
      console.log('🔙 Navegación atrás - URL actual:', url);

      if (/^\/rutas\/[^\/]+\/[^\/]+$/.test(url)) {
        const segments = url.split('/');
        const routeId = segments[2]; // antes era 3
        await this.router.navigate(['/rutas', routeId]);
        return;
      }

      // 2. /rutas/:id
      if (/^\/rutas\/[^\/]+$/.test(url)) {
        await this.router.navigate(['/rutas']);
        return;
      }

      // 3. /rutas
      if (url === '/rutas') {
        try {
          await this.authService.logout();
        } catch (e) {
          console.error('Error al cerrar sesión:', e);
        }
        await this.router.navigate(['/login']);
        return;
      }

      // 4. Por defecto
      console.log('Usando location.back()');
      this.location.back();
    } finally {
      // desbloquear después de 500ms
      setTimeout(() => (this.isGoingBack = false), 500);
    }
  }
}
