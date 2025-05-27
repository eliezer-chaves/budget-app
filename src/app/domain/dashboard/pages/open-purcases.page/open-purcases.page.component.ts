import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { iUser } from '@domain/auth/interfaces/user.interface';
import { AuthService } from '@domain/auth/services/auth.service';
import { injectSupabase } from '@shared/functions/inject-supabase.function';
import { LoadingService } from '@shared/services/loading/loading.service';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import {
  NzTableFilterFn,
  NzTableFilterList,
  NzTableModule,
  NzTableSortFn,
  NzTableSortOrder
} from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

interface ItemData {
  id: string;
  date: Date | null;
  purchaseName: string;
  state: boolean;
  total: number;
}

interface ColumnItem {
  name: string;
  sortOrder: NzTableSortOrder | null;
  sortDirections: NzTableSortOrder[];
  sortFn: NzTableSortFn<ItemData> | null;
  filterConfig?: {
    listOfFilter?: NzTableFilterList;
    filterFn?: NzTableFilterFn<ItemData>;
    filterMultiple?: boolean;
  };
}

@Component({
  selector: 'app-open-purchases-page',
  standalone: true,
  templateUrl: './open-purcases.page.component.html',
  styleUrls: ['./open-purcases.page.component.css'],
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
    NzPopconfirmModule,
    NzGridModule,
    NzSpinModule
  ]
})
export class OpenPurchasesComponent implements OnInit {
  private supabase = injectSupabase();
  private auth = inject(AuthService);
  private message = inject(NzMessageService);
  private notificationService = inject(NzNotificationService);
  protected LoadingService = inject(LoadingService);

  user = signal<iUser | null>(null);
  tableItems: ItemData[] = [];
  listCategory: { nome: string, id: string }[] = [];
  loadingTable = true
  listOfColumns: ColumnItem[] = [
    {
      name: 'Data',
      sortOrder: null,
      sortFn: (a, b) => {
        const aTime = a.date ? a.date.getTime() : 0;
        const bTime = b.date ? b.date.getTime() : 0;
        return aTime - bTime;
      },
      sortDirections: ['ascend', 'descend', null],
    },
    {
      name: 'Orçamento',
      sortOrder: null,
      sortFn: (a, b) => a.purchaseName.localeCompare(b.purchaseName),
      sortDirections: ['ascend', 'descend', null],
    },
    {
      name: 'Situação',
      sortOrder: null,
      sortFn: (a: ItemData, b: ItemData) => (a.state ? 1 : 0) - (b.state ? 1 : 0),
      sortDirections: ['ascend', 'descend', null],
      filterConfig: {
        listOfFilter: [
          { text: 'Em aberto', value: false },
          { text: 'Finalizada', value: true }
        ],
        filterFn: (list: boolean[], item: ItemData) => list.some(value => item.state === value),
        filterMultiple: true,
      }
    },
    {
      name: 'Ações',
      sortOrder: null,
      sortFn: null,
      sortDirections: [null],
    },
    {
      name: 'Total',
      sortOrder: null,
      sortFn: (a: ItemData, b: ItemData) => Number(a.total || 0) - Number(b.total || 0),
      sortDirections: ['ascend', 'descend', null],
    },
  ];

  ngOnInit() {
    this.loadPurchases();
  }

  async loadPurchases() {
    this.LoadingService.startLoading();
    try {
      const currentUser = await this.auth.loadUser();
      if (currentUser) {
        this.user.set(currentUser);

        const { data: pur_purchase, error } = await this.supabase
          .from('pur_purchase')
          .select('*')
          .eq('pur_auth_id', this.user()?.id)
          .order('pur_date', { ascending: false });

        if (error) throw error;

        if (pur_purchase) {
          // Cria um array de Promises para os totais
          const purchasesWithTotals = await Promise.all(
            pur_purchase.map(async (purchase) => {
              const total = await this.countTotal(purchase.pur_id);
              return {
                id: purchase.pur_id,
                date: new Date(purchase.pur_date),
                purchaseName: purchase.pur_market_name,
                state: purchase.pur_state,
                total: total // Já resolvido
              };
            })
          );

          this.tableItems = purchasesWithTotals;

          this.listCategory = pur_purchase.map(purchase => ({
            nome: purchase.pur_market_name,
            id: purchase.pur_id.toString()
          }));
        }
      }
    } catch (error) {
      this.notificationService.error('Erro', 'Falha ao carregar as compras');
      console.error('Error loading purchases:', error);
    } finally {
      this.LoadingService.stopLoading();
    }
  }



  async countTotal(purchaseId: string) {

    // Primeiro, buscamos os carrinhos relacionados à compra
    let { data: carts, error: cartError } = await this.supabase
      .from('car_carts')
      .select('car_id')
      .eq('car_purchase_id', purchaseId);

    if (cartError) {
      console.error('Erro ao buscar carrinhos:', cartError);
      return 0; // Ou lançar um erro, dependendo da sua necessidade
    }

    const cartIds = carts?.map(cart => cart.car_id) || [];

    if (cartIds.length === 0) {
      return 0; // Não há carrinhos para esta compra
    }

    // Agora buscamos a soma dos itens desses carrinhos
    let { data: items, error: itemError } = await this.supabase
      .from('itm_item')
      .select('itm_total')
      .in('itm_cart_id', cartIds);

    if (itemError) {
      console.error('Erro ao buscar itens:', itemError);
      return 0;
    }

    // Calcula o total somando todos os itm_total
    const total = items?.reduce((sum, item) => sum + (item.itm_total || 0), 0) || 0;

    return total;
  }

  getUniquePurchases(): string[] {
    const purchasesId = new Set<string>();
    this.tableItems.forEach(purchase => {
      if (purchase.purchaseName) {
        purchasesId.add(purchase.purchaseName);
      }
    });
    return Array.from(purchasesId).sort();
  }

  openPruchase(purchaseId: string) {
    console.log('Abrindo compra:', purchaseId);
  }
  async deletePurchase(purchaseId: string) {
    console.log('Deletando compra:', purchaseId);
    try {
      const { data, error } = await this.supabase
        .from('pur_purchase')
        .delete()
        .eq('pur_id', purchaseId)
      this.loadPurchases();

    } catch (error) {
      this.notificationService.error('Erro', 'Falha ao deletar a compra');
    } finally {
      this.loadPurchases();
    }

  }
  constructor(private modal: NzModalService) { }

  showDeleteConfirm(purchaseId: string): void {
    this.modal.confirm({
      nzTitle: '<i>Você tem certeza que quer excluir esse orçamento?</i>',
      nzContent: '<b style="color: red;">Todos os itens desse orçamento serão deletados e não será possível recuperá-los...</b>',
      nzOkText: 'Excluir Orçamento',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deletePurchase(purchaseId),
      nzCancelText: 'Voltar',
      nzOnCancel: () => ''
    });
  }
}