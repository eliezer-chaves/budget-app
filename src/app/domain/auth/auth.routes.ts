import { Routes } from '@angular/router';
import { isLoggedInGuard } from '@core/guards/is-logged-in.guard';
import { redirectIfLoggedInGuard } from '@core/guards/redirectIfLoggedInGuard.guard';
export const AUTH_ROUTES: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login'
    },
    {
        path: 'login',
        canActivate: [redirectIfLoggedInGuard],
        loadComponent: () => import('./pages/login.page/login.page.component').then(m => m.LoginPageComponent),
    },
    {
        path: 'forgot-password',
        canActivate: [redirectIfLoggedInGuard],
        loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    },
    {
        path: 'reset-password',
        canActivate: [isLoggedInGuard], // ← CORRETO (só permite usuários logados)
        loadComponent: () => import('@core/pages/reset-password-page/reset-password-page.component').then(m => m.ResetPasswordPageComponent),
    },
    {
        path: 'create-account',
        canActivate: [redirectIfLoggedInGuard],
        loadComponent: () => import('./pages/create-account/create-account.component').then(m => m.CreateAccountComponent),
    }
];
