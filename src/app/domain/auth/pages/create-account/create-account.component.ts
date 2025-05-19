import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule
} from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AuthService } from '@domain/auth/services/auth.service';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { LoadingService } from '../../../../shared/services/loading/loading.service';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';

@Component({
  selector: 'app-create-account',
  standalone: true,
  imports: [
    CommonModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    ReactiveFormsModule,
    RouterModule,
    NzFlexModule,
    NzDividerModule,
    NzIconModule,
    NgxMaskDirective,
  ],
  providers: [provideNgxMask()],

  templateUrl: './create-account.component.html',
  styleUrl: './create-account.component.css'
})
export class CreateAccountComponent {
  passwordVisible = false;
  confirmPasswordVisible = false;

  loadingService = inject(LoadingService);
  private authService = inject(AuthService);
  private notificationService = inject(NzNotificationService);
  private router = inject(Router);

  
  formularioCadastro: FormGroup = new FormGroup(
    {
      nome: new FormControl('', [Validators.required]),
      telefone: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: new FormControl('', [Validators.required])
    },
    {
      validators: [this.matchPasswordsValidator]
    }
  );

  matchPasswordsValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }
  enviarCadastro() {
    this.loadingService.startLoading();
    if (this.formularioCadastro.valid) {
      
      const { nome, telefone, email, password } = this.formularioCadastro.value;

      // Separando os dados
      const nomeUsuario = nome;
      const telefoneUsuario = telefone;
      const emailUsuario = email;
      const senhaUsuario = password;

      this.authService.signUpWithEmail(emailUsuario, senhaUsuario, telefoneUsuario, nomeUsuario)
        .then(() => {
          // Se o cadastro for bem-sucedido, mostra a notificação
          this.formularioCadastro.reset();
        })
        .catch((error) => {
          // Caso o erro seja capturado no signUpWithEmail, ele será tratado lá
        });

      
    } else {
      this.formularioCadastro.markAllAsTouched();
      this.notificationService.warning('Formulário inválido', 'Preencha todos os campos obrigatórios corretamente.');
    }
    this.loadingService.stopLoading();
  }

  
}
