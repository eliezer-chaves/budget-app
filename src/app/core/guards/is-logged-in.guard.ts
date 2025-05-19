// src\app\core\guards\is-logged-in.guard.ts
import type { CanActivateFn } from '@angular/router';
import { AuthService } from '@domain/app/auth/services/auth.service';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const isLoggedInGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Carrega e verifica o usuário
  const isAuthenticated = await authService.loadUser();

  if (!isAuthenticated) {
    router.navigate(['/auth/login']);
    return false;
  }

  return true;
};