import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, inject, OnInit, Output, QueryList, signal, ViewChildren } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { iUser } from '@domain/auth/interfaces/user.interface';
import { AuthService } from '@domain/auth/services/auth.service';
import { injectSupabase } from '@shared/functions/inject-supabase.function';
import { FirstNamePipe } from '@shared/pipes/firstName.pipe/firstName.pipe';
import { LoadingService } from '@shared/services/loading/loading.service';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinComponent } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';

@Component({
  selector: 'app-modal-add-purchase',
  templateUrl: './modal-add-purchase.component.html',
  styleUrls: ['./modal-add-purchase.component.css'],
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
    RouterModule,

    NzBadgeModule,
    NzRadioModule,
    NzTimelineModule
  ]
})
export class ModalAddPurchaseComponent implements OnInit {
  private auth = inject(AuthService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  protected LoadingService = inject(LoadingService);
  private supabase = injectSupabase();
  private notificationService = inject(NzNotificationService);
  private modalService = inject(NzModalService);
  user = signal<iUser | null>(null);
  isVisible = false;
  isConfirmLoading = false;
  dataCompra = new Date();
  mercadoNome = '';
  carrinhosNames: string[] = [''];
  qtdCarrinhos = 1;
  @ViewChildren('inputEl') inputElements!: QueryList<ElementRef>;
  isVisibleComponentNewPurchase = false
  constructor() { }

  ngOnInit() {
  }
  newPurchase(): void {
    this.isVisibleComponentNewPurchase = true
  }
  handleCancelNewPurchase(): void {
    this.isVisibleComponentNewPurchase = false;
  }
  cancelPurchase(): void{
    this.isVisibleComponentNewPurchase = false;
  }
  async handleOkNewPurchase() {
    this.createPurchase()
  }

  async createPurchase() {
   const currentUser = await this.auth.loadUser();
      if (currentUser) {
        this.user.set(currentUser);

      } else {
        this.message.error('Sessão inválida. Faça login novamente.');
      }
    this.isConfirmLoading = true;

    const userId = this.user()?.id;
    // Valida se campos críticos estão preenchidos
    if (
      !this.dataCompra ||
      !this.mercadoNome?.trim() ||
      this.carrinhosNames.length === 0 ||
      this.carrinhosNames.some(name => !name.trim())
    ) {
      this.notificationService.error('Informe os campos', 'Preencha todos os campos!');
      this.isConfirmLoading = false;
      return;
    }

    try {
      // 1. Inserir a compra principal no Supabase
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

      // 2. Inserir cada carrinho no Supabase
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

      // 3. Salvar apenas a compra atual no localStorage
      const currentPurchase = {
        purchaseId: purchaseId,
        currentPurchase: true, // Flag para identificar a compra atual
        dataCompra: this.dataCompra,
        mercadoNome: this.mercadoNome
      };

      // Remove qualquer compra marcada como atual anteriormente
      const existingPurchases = JSON.parse(localStorage.getItem('purchases') || '[]');
      const updatedPurchases = existingPurchases.map((p: any) => ({
        ...p,
        currentPurchase: false
      }));

      // Adiciona a nova compra como atual
      updatedPurchases.push(currentPurchase);
      localStorage.setItem('purchases', JSON.stringify(updatedPurchases));

      // Navega para a página de compras com o ID
      this.router.navigate(['/dashboard/compras'], {
        state: { purchaseId: purchaseId }
      });

    } catch (error) {
      console.error('Erro ao criar compra:', error);
      this.notificationService.error('Erro', 'Erro ao iniciar nova compra');
    } finally {
      this.isConfirmLoading = false;
      this.isVisible = false;
    }
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
  onChange(result: Date): void {
    // Implementação se necessário
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
 

  trackByFn(index: number): number {
    return index;
  }

  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
    this.isVisibleComponentNewPurchase = false
  }

}
