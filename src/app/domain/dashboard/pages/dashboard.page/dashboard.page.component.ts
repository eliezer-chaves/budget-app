import { Component, ElementRef, inject, OnInit, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import { AuthService } from '@domain/auth/services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Router, RouterModule } from '@angular/router';
import { iUser } from '@domain/auth/interfaces/user.interface';
import { CommonModule } from '@angular/common';
import { LoadingService } from '@shared/services/loading/loading.service';
import { NzTableModule } from 'ng-zorro-antd/table';
import { SupabaseClient } from '@supabase/supabase-js';
import { injectSupabase } from '@shared/functions/inject-supabase.function';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerComponent, NzDividerModule } from 'ng-zorro-antd/divider';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { getISOWeek } from 'date-fns';
import { NzSelectModule } from 'ng-zorro-antd/select';

import { NzDatePickerComponent, NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzI18nService, pt_BR } from 'ng-zorro-antd/i18n';

@Component({
  standalone: true,
  selector: 'app-dashboard.page',
  templateUrl: './dashboard.page.component.html',
  styleUrls: ['./dashboard.page.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzTagModule,
    NzPaginationModule,
    NzTableModule,
    NzModalModule,
    NzDatePickerModule,
    NzSelectModule,
    NzIconModule,
    NzInputNumberModule,
    NzDividerModule,
    RouterModule
  ],
})
export class DashboardPageComponent implements OnInit {
  private auth = inject(AuthService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  protected LoadingService = inject(LoadingService);
  private supabase = injectSupabase();
  private notificationService = inject(NzNotificationService);
  private modalService = inject(NzModalService);

  user = signal<iUser | null>(null);
  loading = true;
  isOkLoading = false;

  // Modal state
  isVisible = false;
  isConfirmLoading = false;
  dataCompra = new Date();
  mercadoNome = '';
  qtdCarrinhos = 1;
  carrinhosNames: string[] = [''];
  @ViewChildren('inputEl') inputElements!: QueryList<ElementRef>;

  ngOnInit() {
    this.loadData();
    this.checkOpenPurchase();
  }

  async loadData() {
    try {
      const currentUser = await this.auth.loadUser();
      if (currentUser) {
        this.user.set(currentUser);
      } else {
        this.message.error('Sessão inválida. Faça login novamente.');
      }
    } catch (error) {
      console.error('Erro:', error);
      this.message.error('Erro ao carregar dados do usuário');
    } finally {
      this.loading = false;
    }
  }

  async checkOpenPurchase() {
    const dadosSalvos = localStorage.getItem('ultimaCompra');
    if (dadosSalvos) {
      const dadosCompra = JSON.parse(dadosSalvos);
      if (dadosCompra.compraFinalizada === false) {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  async logout() {
    this.LoadingService.startLoading();
    await this.auth.logoutService();
    this.LoadingService.stopLoading();
    this.router.navigate(['/auth']);
  }

  redefinirSenha() {
    this.router.navigate(['/auth/reset-password']);
  }

  showModal(): void {
    const dadosSalvos = localStorage.getItem('ultimaCompra');
    if (dadosSalvos) {
      const dadosCompra = JSON.parse(dadosSalvos);
      if (dadosCompra.compraFinalizada === false) {
        this.modalService.info({
          nzTitle: 'Compra em Andamento',
          nzContent: 'Você já tem uma compra em aberto. Por favor, finalize a compra atual antes de iniciar uma nova.',
          nzOnOk: () => this.router.navigate(['/dashboard/compras'])
        });
        return;
      }
    }
    this.isVisible = true;
  }

  handleCancel(): void {
    this.isVisible = false;
  }
  generateRandomId(): number {
    // Cria um array de 4 inteiros de 32 bits (128 bits no total)
    const randomValues = new Uint32Array(4);
    window.crypto.getRandomValues(randomValues);

    // Combina dois valores de 32 bits para formar um de 64 bits
    // Usamos apenas 53 bits para ficar dentro do limite seguro do JavaScript (Number.MAX_SAFE_INTEGER)
    const high = randomValues[0] & 0x1FFFFF; // 21 bits
    const low = randomValues[1]; // 32 bits
    const randomPart = (high * 0x100000000) + low; // 53 bits no total

    // Garante que o número seja positivo e dentro do limite seguro
    return Math.abs(randomPart % Number.MAX_SAFE_INTEGER);
  }

  async handleOk() {
    this.isConfirmLoading = true;
    const userId = this.user()?.id;

    if (!userId) {
      this.message.error('Usuário não autenticado');
      this.isConfirmLoading = false;
      return;
    }

    // Valida se campos críticos estão preenchidos
    if (
      !this.dataCompra ||
      !this.mercadoNome?.trim() ||
      this.carrinhosNames.length === 0 ||
      this.carrinhosNames.some(name => !name.trim())
    ) {
      this.notificationService.error('Informe os campos', 'Preencha todos os campos!  ')
      this.isConfirmLoading = false;
      return; // Sai da função se a validação falhar
    }
    try {
      // 1. Inserir a compra principal
      const { data: purchaseData, error: purchaseError } = await this.supabase
        .from('pur_purchase')
        .insert([
          {
            pur_id: this.generateRandomId(),
            pur_auth_id: userId,
            pur_date: this.dataCompra,
            pur_market_name: this.mercadoNome,
            pur_carts_quantity: this.qtdCarrinhos,
          }
        ])
        .select('pur_id');

      if (purchaseError || !purchaseData?.[0]?.pur_id) {
        throw purchaseError || new Error('Falha ao obter ID da compra');
      }

      const purchaseId = purchaseData[0].pur_id;

      // 2. Inserir cada carrinho
      const cartsIds = [];
      for (const nomeCarrinho of this.carrinhosNames) {
        const { data: cartData, error: cartError } = await this.supabase
          .from('car_carts')
          .insert([
            {
              car_name: nomeCarrinho,
              car_purchase_id: purchaseId,
              car_auth_id: userId,
            }
          ])
          .select('car_id');

        if (cartError || !cartData?.[0]?.car_id) {
          console.error(`Erro ao inserir carrinho ${nomeCarrinho}:`, cartError);
          continue;
        }
        cartsIds.push(cartData[0].car_id);
      }

      if (cartsIds.length === 0) {
        throw new Error('Nenhum carrinho foi criado com sucesso');
      }

      // Salvar no localStorage
      const navigationState = {
        purchaseId: purchaseId,
        cartsIds: cartsIds,
        dataCompra: this.dataCompra,
        mercado: this.mercadoNome,
        qtdCarrinhos: this.qtdCarrinhos,
        nomeCarrinhos: this.carrinhosNames,
        compraFinalizada: false,
        items: []
      };
      localStorage.setItem('ultimaCompra', JSON.stringify(navigationState));
      this.router.navigate(['/dashboard/compras']);

    } catch (error) {
      console.error('Erro ao criar compra:', error);
      this.message.error('Erro ao iniciar nova compra');
    } finally {
      this.isConfirmLoading = false;
      this.isVisible = false;
    }
  }



  trackByFn(index: number): number {
    return index;
  }

  onQtdCarrinhosChange(newValue: number) {
    const currentLength = this.carrinhosNames.length;
    if (newValue > currentLength) {
      for (let i = currentLength; i < newValue; i++) {
        this.carrinhosNames.push('');
      }
    } else if (newValue < currentLength) {
      this.carrinhosNames.length = newValue;
    }
  }

  onKeyDown(event: KeyboardEvent, currentIndex: number) {
    if (event.key === 'Enter') {
      event.preventDefault();
      const nextIndex = currentIndex + 1;
      if (nextIndex < this.inputElements.length) {
        this.inputElements.toArray()[nextIndex].nativeElement.focus();
      }
    }
  }

  onChange(result: Date): void {
    // Implementação se necessário
  }
}