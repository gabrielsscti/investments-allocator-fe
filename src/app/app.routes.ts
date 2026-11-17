import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'inflow'
  },
  {
    path: 'inflow',
    loadComponent: () =>
      import('./features/inflow/inflow-ritual.component').then((m) => m.InflowRitualComponent)
  },
  {
    path: 'portfolio',
    loadComponent: () =>
      import('./features/maintenance/maintenance.component').then((m) => m.MaintenanceComponent)
  },
  {
    path: '**',
    redirectTo: 'inflow'
  }
];
