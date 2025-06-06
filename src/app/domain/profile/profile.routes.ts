import { Routes } from '@angular/router';
import { isLoggedInGuard } from '@core/guards/is-logged-in.guard';

export const PROFILE_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    }
];
