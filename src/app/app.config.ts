import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom, inject } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { pt_BR, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import pt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './domain/auth/services/auth.service';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAppInitializer } from '@angular/core'; // <-- esse aqui

registerLocaleData(pt);

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }),
     provideRouter(routes), 
     provideNzI18n(pt_BR), 
     importProvidersFrom(FormsModule), 
     provideAnimationsAsync(), 
     provideHttpClient(),
     // Inicializador do usuario
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return authService.loadUser(); // 👈 Aqui você chama a função que retorna a Promise
    })

    ]
};
