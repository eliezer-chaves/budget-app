// src/app/core/guards/redirect-if-logged-in.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@domain/app/auth/services/auth.service';

export const redirectIfLoggedInGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Carrega e verifica o usuário
  const isAuthenticated = await authService.loadUser();

  if (isAuthenticated) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
