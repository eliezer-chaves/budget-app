import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { injectSupabase } from '@shared/functions/inject-supabase.function';
import { LoadingService } from '../../../../shared/services/loading/loading.service';

@Component({
  selector: 'app-forgot-password',
  imports: [NzFormModule, NzInputModule, NzButtonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  private supabase = injectSupabase()
  private router = inject(Router)
  private notificationService = inject(NzNotificationService)
  protected LoadingService = inject(LoadingService)

  email = signal('')

  async submit() {
    this.LoadingService.startLoading()
    await this.supabase.auth.resetPasswordForEmail(this.email())
    this.notificationService.success('Email enviado com sucesso', 'Verifique sua caixa de entrada');
    this.email.set('')
    this.LoadingService.stopLoading()
  }

  voltar() {
    this.router.navigate(['/auth']);
  }
}
