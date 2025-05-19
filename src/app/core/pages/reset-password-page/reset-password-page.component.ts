import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { injectSupabase } from '@shared/functions/inject-supabase.function';
import { LoadingService } from '../../../shared/services/loading/loading.service';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    NzIconModule,
    CommonModule
  ],
  templateUrl: './reset-password-page.component.html',
  styleUrl: './reset-password-page.component.css'
})
export class ResetPasswordPageComponent {
  private supabase = injectSupabase();
  private router = inject(Router);
  private notificationService = inject(NzNotificationService);
  protected loadingService = inject(LoadingService);

  passwordVisible = false;
  confirmPasswordVisible = false;

  formularioReset: FormGroup = new FormGroup(
    {
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: new FormControl('', [Validators.required])
    },
    {
      validators: [this.matchPasswordsValidator]
    }
  );

  private matchPasswordsValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  async reset() {
    if (this.formularioReset.invalid) {
      this.notificationService.error('Erro', 'Por favor, preencha todos os campos corretamente');
      return;
    }

    this.loadingService.startLoading();
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: this.formularioReset.value.password
      });

      if (error) {
        throw error;
      }

      this.notificationService.success('Sucesso', 'Sua senha foi alterada com sucesso');
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      this.notificationService.error('Erro', 'Ocorreu um erro ao alterar a senha');
    } finally {
      this.loadingService.stopLoading();
    }
  }
}