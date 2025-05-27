import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  private router = inject(Router);

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
          { text: 'Não Pago', value: false },
          { text: 'Pago', value: true }
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
  loadingCards = true
  totalGasto: number = 0
  totalAbertoMes: number = 0
  comprasRealizadas: number = 0
  comprasEmAberto: number = 0
  periodo: [Date, Date] = [new Date(), new Date()];
  dateFormat = 'dd/MM/yyyy';
  ngOnInit() {
    this.setCurrentMonthRange()
    this.loadPurchases();
    this.loadTotalGasto()
    this.loadTotalAberto()
    this.contarCompras()
    this.contarComprasEmAberto()
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
    //console.log('Abrindo compra:', purchaseId);
    this.router.navigate(['/dashboard/compras'], {
      state: { purchaseId: purchaseId }
    });
  }

  async deletePurchase(purchaseId: string) {
    try {
      const { data, error } = await this.supabase
        .from('pur_purchase')
        .delete()
        .eq('pur_id', purchaseId)
      this.loadPurchases();

      // Recupera o array do localStorage
      const stored = localStorage.getItem('purchases');
      if (stored) {
        const compras = JSON.parse(stored);
        const atualizadas = compras.filter((item: any) => item.purchaseId !== purchaseId);
        localStorage.setItem('purchases', JSON.stringify(atualizadas));
      }


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


  onChangeDatePicker(dates: Date[] | null) {
    if (dates && dates.length === 2) {
      this.periodo = [dates[0], dates[1]]; // cria a tupla explicitamente
      this.loadDataForSelectedPeriod();
    }
  }

  setCurrentMonthRange() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.periodo = [firstDay, lastDay];
  }


  // Cria um método que carrega TODOS os dados conforme o período selecionado
  async loadDataForSelectedPeriod() {
    if (!this.periodo || this.periodo.length !== 2) return;

    this.LoadingService.startLoading();

    try {
      // Passa as datas do período
      const [start, end] = this.periodo;

      // Passa as datas para as funções que carregam dados, adaptando-as para receber o período:
      await Promise.all([
        this.loadTotalGasto(start, end),
        this.contarCompras(start, end),
        this.contarComprasEmAberto(start, end),
        this.loadTotalAberto(start, end)
      ]);

      // Atualiza a tabela
      await this.loadPurchases(start, end);

    } catch (error) {
      this.notificationService.error('Erro', 'Falha ao carregar os dados para o período selecionado');
    } finally {
      this.LoadingService.stopLoading();
    }
  }

  // Adaptar os métodos para receber start e end como parâmetro:
  async contarComprasEmAberto(data_inicio?: Date, data_fim?: Date) {
    const start = data_inicio || this.periodo[0];
    const end = data_fim || this.periodo[1];
    const { data, error } = await this.supabase
      .rpc('contar_compras_pendentes_mes', {
        data_inicio: start.toISOString(),
        data_fim: end.toISOString(),
      });
    if (error) {
      console.error('Erro ao contar compras em aberto:', error.message);
    } else {
      this.comprasEmAberto = data;
    }
  }

  async contarCompras(data_inicio?: Date, data_fim?: Date) {
    const start = data_inicio || this.periodo[0];
    const end = data_fim || this.periodo[1];
    const { data, error } = await this.supabase
      .rpc('contar_compras_usuario_mes', {
        data_inicio: start.toISOString(),
        data_fim: end.toISOString(),
      });
    if (error) {
      console.error('Erro ao contar compras finalizadas:', error.message);
    } else {
      this.comprasRealizadas = data;
    }
  }

  async loadTotalGasto(data_inicio?: Date, data_fim?: Date) {
    const start = data_inicio || this.periodo[0];
    const end = data_fim || this.periodo[1];

    const { data, error } = await this.supabase
      .rpc('get_user_item_total_mes', {
        data_inicio: start.toISOString(),
        data_fim: end.toISOString(),
      });

    if (error) {
      console.error('Erro ao carregar total gasto:', error.message);
      return 0;
    } else {
      this.totalGasto = data;
      return data;
    }
  }

  async loadTotalAberto(data_inicio?: Date, data_fim?: Date) {
    const start = data_inicio || this.periodo[0];
    const end = data_fim || this.periodo[1];

    const { data, error } = await this.supabase
      .rpc('get_user_item_total_mes_nao_gasto', {
        data_inicio: start.toISOString(),
        data_fim: end.toISOString(),
      });

    if (error) {
      console.error('Erro ao carregar total em aberto:', error.message);
      return 0;
    } else {
      this.totalAbertoMes = data;
      return data;
    }
  }


  async loadPurchases(data_inicio?: Date, data_fim?: Date) {
    this.LoadingService.startLoading();
    this.loadTotalGasto()
    this.loadTotalAberto()
    this.contarCompras()
    this.contarComprasEmAberto()
    try {
      const currentUser = await this.auth.loadUser();
      if (currentUser) {
        this.user.set(currentUser);

        const start = data_inicio || this.periodo[0];
        const end = data_fim || this.periodo[1];

        const { data: pur_purchase, error } = await this.supabase
          .from('pur_purchase')
          .select('*')
          .eq('pur_auth_id', this.user()?.id)
          .gte('pur_date', start.toISOString())
          .lte('pur_date', end.toISOString())
          .order('pur_date', { ascending: false });

        if (error) throw error;

        if (pur_purchase) {
          const purchasesWithTotals = await Promise.all(
            pur_purchase.map(async (purchase) => {
              const total = await this.countTotal(purchase.pur_id);
              return {
                id: purchase.pur_id,
                date: purchase.pur_date,
                purchaseName: purchase.pur_market_name,
                state: purchase.pur_state,
                total: total
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
      this.loadingCards = false;

    } catch (error) {
      this.notificationService.error('Erro', 'Falha ao carregar as compras');
      console.error('Error loading purchases:', error);
    } finally {
      this.LoadingService.stopLoading();
    }
  }



}