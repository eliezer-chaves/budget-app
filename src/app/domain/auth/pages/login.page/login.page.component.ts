import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { injectSupabase } from '@shared/functions/inject-supabase.function';
import { AuthService } from '@domain/auth/services/auth.service';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { LoadingService } from '@shared/services/loading/loading.service';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-login.page',
  standalone: true,
  imports: [NzFormModule, NzInputModule, NzButtonModule, ReactiveFormsModule, RouterModule, NzFlexModule, NzDividerModule, NzIconModule],
  templateUrl: './login.page.component.html',
  styleUrls: ['./login.page.component.css']
})
export class LoginPageComponent {
  isVertical = true;
  passwordVisible = false;
  confirmPasswordVisible = false;
  formularioLogin: FormGroup;
  private load = inject(AuthService)
  private supabase = injectSupabase();
  private notificationService = inject(NzNotificationService);
  private router = inject(Router);
  protected LoadingService = inject(LoadingService);
  
  constructor() {
    this.formularioLogin = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required])
    });
  }

  async login(): Promise<void> {
    this.LoadingService.startLoading();

    if (!this.formularioLogin.valid) {
      this.notificationService.error('Formulário inválido', 'Verifique os campos e tente novamente');
      this.LoadingService.stopLoading();

      return;
    }
    const { email, password } = this.formularioLogin.value;
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });

    if (error) {
      this.notificationService.error('Erro ao fazer login', 'Verifique os campos e tente novamente');
      this.LoadingService.stopLoading();
      return;
    }

    await this.load.loadUser(); // 👈 Carrega os dados do usuário
    this.LoadingService.stopLoading();
    this.router.navigate(['/']);


  }

  async registerWithGoogle() {
    this.LoadingService.startLoading();
    await this.load.loginWithGoogle();
    this.LoadingService.stopLoading();
  }
}
