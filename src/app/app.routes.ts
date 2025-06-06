import { Routes } from '@angular/router';
import { isLoggedInGuard } from '@core/guards/is-logged-in.guard';
import { redirectIfLoggedInGuard } from '@core/guards/redirectIfLoggedInGuard.guard';
import { AUTH_ROUTES } from '@domain/auth/auth.routes';
import { DASHBOARD_ROUTES } from '@domain/dashboard/dashboard.routes'
import { DashboardLayoutComponent } from '@core/layout/dashboard/dashboard.layout/dashboard.layout.component'
import { PROFILE_ROUTES } from '@domain/profile/profile.routes';
// src/app/app.routes.ts
export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
    },
    {
        path: 'auth',
        loadComponent: () => import('./core/layout/auth/auth.layout/auth.layout.component').then(m => m.AuthLayoutComponent),
        children: AUTH_ROUTES
    },
    {
        path: 'dashboard',
        canActivate: [isLoggedInGuard],
        loadComponent: () => import('@core/layout/dashboard/dashboard.layout/dashboard.layout.component').then(m => m.DashboardLayoutComponent),
        children: DASHBOARD_ROUTES
    },
    {
        path: 'profile',
        canActivate: [isLoggedInGuard],
        loadComponent: () =>
            import('@core/layout/dashboard/dashboard.layout/dashboard.layout.component').then(m => m.DashboardLayoutComponent),
        children: PROFILE_ROUTES
    }
];