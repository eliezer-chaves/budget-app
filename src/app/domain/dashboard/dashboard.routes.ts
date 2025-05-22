import { Routes } from '@angular/router';
import { isLoggedInGuard } from '@core/guards/is-logged-in.guard';

export const DASHBOARD_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./pages/dashboard.page/dashboard.page.component').then(m => m.DashboardPageComponent),
    },
    {
        path: 'compras',

        loadComponent: () =>
            import('./pages/compras.page/compra.page.component').then(m => m.DashboardPageComponent),
    },
    {
        path: 'orcamentos-abertos',
        loadComponent: () =>
            import('./pages/open-purcases.page/open-purcases.page.component').then(m => m.OpenPurchases)
    }
];
