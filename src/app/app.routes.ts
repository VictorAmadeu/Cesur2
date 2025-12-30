import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'privado',
    loadComponent: () => import('./components/private-layout/private-layout.component').then(m => m.PrivateLayoutComponent),
    children: [
      {
        path: 'rutas',
        children: [
          { path: '', loadComponent: () => import('./pages/private/routes/routes.component').then(m => m.RoutesComponent) },
          {
            path: ':id',
            children: [
              { path: '', loadComponent: () => import('./pages/private/routes/route-detail/route-detail.component').then(m => m.RouteDetailComponent) },
              { path: ':expediente', loadComponent: () => import('./pages/private/routes/route-detail/order-detail/order-detail.component').then(m => m.OrderDetailComponent) },
            ],
          },
        ],
      },
      { path: '', redirectTo: 'rutas', pathMatch: 'full' },
    ],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/public/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/public/error/error.component').then(
        (m) => m.ErrorComponent
      ),
  },
];
