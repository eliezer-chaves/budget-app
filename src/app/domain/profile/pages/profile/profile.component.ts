import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@domain/auth/services/auth.service';
import { LoadingService } from '@shared/services/loading/loading.service';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { iUser } from '@domain/auth/interfaces/user.interface';
import { injectSupabase } from '@shared/functions/inject-supabase.function';

@Component({
  standalone: true,
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  imports: [
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    ReactiveFormsModule,
    RouterModule,
    NzFlexModule,
    NzDividerModule,
    NzIconModule,

  ]
})
export class ProfileComponent implements OnInit {

  passwordVisible = false;
  confirmPasswordVisible = false;

  loadingService = inject(LoadingService);
  private authService = inject(AuthService);
  private notificationService = inject(NzNotificationService);
  private router = inject(Router);
  private supabase = injectSupabase();

  user = signal<iUser | null>(null);
  currentUserId: string | undefined = '';
  name: string = '';
  email: string = '';
  password: string = '';
  phone: string = '';
  address: string = '';

  form: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    telefone: new FormControl('', Validators.required),
    email: new FormControl({value: '', disabled: true}, [Validators.required, Validators.email]),
    address: new FormControl(''),
  });

  constructor() { }

  ngOnInit() {
    this.loadUser()
  }

  async loadUser() {
    const currentUser = this.authService.loadUser();
    if (currentUser) {
      this.user.set(await currentUser);
      this.currentUserId = this.user()?.id
    }
    console.log(this.currentUserId)

    try {

      let { data: user, error } = await this.supabase
        .from('tbl_users')
        .select('*')
        .eq('usr_auth_id', this.currentUserId)

      if (user) {
        this.name = user[0].usr_name

        this.form.patchValue({
          name: user[0].usr_name,
          telefone: user[0].usr_phone,
          email: user[0].usr_email,
          address: "",
        })

      }

    }
    catch {

    }
  }

  atualizarUsuario() {

  }

}
