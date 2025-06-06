import { Component, Inject, inject, OnInit, signal } from '@angular/core';
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
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { ViacepService } from '@shared/services/api/viacep.service';

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
    NgxMaskDirective
  ],
  providers: [provideNgxMask()],

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
  cep: string = '';
  numero: string = '';
  rua: string = '';
  bairro: string = '';
  cidade: string = '';
  uf: string = '';
  complemento: string = '';

  form: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    telefone: new FormControl('', Validators.required),
    email: new FormControl({ value: '', disabled: true }, [Validators.required, Validators.email]),
    cep: new FormControl(''),
    numero: new FormControl(''),
    rua: new FormControl(''),
    bairro: new FormControl(''),
    cidade: new FormControl(''),
    uf: new FormControl(''),
    complemento: new FormControl(''),
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
          cep: user[0].usr_address?.cep,
          numero: user[0].usr_address?.numero,
          rua: user[0].usr_address?.rua,
          bairro: user[0].usr_address?.bairro,
          cidade: user[0].usr_address?.cidade,
          uf: user[0].usr_address?.uf,
          complemento: user[0].usr_address?.complemento,
        })

      }

    }
    catch {

    }
  }

  async atualizarUsuario() {
    try {
      this.loadingService.startLoading()
      const endereco = {
        cep: this.form.get('cep')?.value,
        numero: this.form.get('numero')?.value,
        rua: this.form.get('rua')?.value,
        bairro: this.form.get('bairro')?.value,
        cidade: this.form.get('cidade')?.value,
        uf: this.form.get('uf')?.value,
        complemento: this.form.get('complemento')?.value
      };

      const { error } = await this.supabase
        .from('tbl_users')
        .update({
          usr_name: this.form.get('name')?.value,
          usr_phone: this.form.get('telefone')?.value,
          usr_address: endereco
        })
        .eq('usr_auth_id', this.currentUserId);
      this.loadingService.stopLoading()
      this.notificationService.success('Sucesso', 'Usuário atualizado com sucesso');
    }
    catch {
      this.loadingService.stopLoading()
      this.notificationService.error('Erro', 'Não foi possível atualizar o usuário');
    }

  }

  private viacep = inject(ViacepService);

  viaCEPApi(event: Event) {
    const input = event.target as HTMLInputElement;
    const cep = input.value.replace(/\D/g, '');

    if (cep.length === 8) {
      this.viacep.buscarCep(cep).subscribe({
        next: (dados) => {

          this.form.patchValue({
            rua: dados.logradouro,
            bairro: dados.bairro,
            cidade: dados.localidade,
            uf: dados.uf,
          });
        },
        error: () => {
          this.notificationService.error('Erro', 'Não foi possível buscar o CEP');
        }
      });
    }
  }


}
