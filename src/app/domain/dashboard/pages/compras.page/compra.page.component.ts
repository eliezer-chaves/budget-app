import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '@domain/auth/services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Router } from '@angular/router';
import { iUser } from '@domain/auth/interfaces/user.interface';
import { CommonModule } from '@angular/common';
import { LoadingService } from '@shared/services/loading/loading.service';
import { NzTableModule } from 'ng-zorro-antd/table';
import { injectSupabase } from '@shared/functions/inject-supabase.function';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { CartItem } from '@domain/dashboard/interfaces/CartItem';
import { PurchaseData } from '@domain/dashboard/interfaces/PurchaseData';
import { ColumnItem } from '@domain/dashboard/interfaces/ColumnItem';
import { ItemData } from '@domain/dashboard/interfaces/ItemData';


@Component({
  standalone: true,
  selector: 'app-compra.page',
  templateUrl: './compra.page.component.html',
  styleUrls: ['./compra.page.component.css'],
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
    NzGridModule

  ],
})
export class DashboardPageComponent implements OnInit {
  private auth = inject(AuthService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  protected LoadingService = inject(LoadingService);
  private supabase = injectSupabase();
  private notificationService = inject(NzNotificationService);

  user = signal<iUser | null>(null);
  loading = true;
  dataSet: CartItem[] = [];
  carrinhoSelecionado: string = '';
  nomeCarrinhos: string[] = [];
  dataCompra: Date = new Date();
  mercado: string = '';
  item: string = '';
  qtdCarrinhos: number = 1;
  cartsIds: number[] = [];
  purchaseId: number = 0;

  valorUnidade: string = '';
  itemQtd: number = 1;
  valorTotal: number = 0;
  valorUnidadeRaw: number = 0;
  tableItems: any[] = [];
  mostrarTabela: boolean = false
  // Cache para edição
  editCache: { [key: string]: { edit: boolean; data: ItemData } } = {};

  listOfColumns: ColumnItem[] = [
    {
      name: 'Item',
      sortOrder: null,
      sortFn: (a: ItemData, b: ItemData) => a.name.localeCompare(b.name),
      sortDirections: ['ascend', 'descend', null],
    },
    {
      name: 'Qtd',
      sortOrder: null,
      sortFn: (a: ItemData, b: ItemData) => (a.quantity || 0) - (b.quantity || 0),
      sortDirections: ['ascend', 'descend', null],
    },
    {
      name: 'Valor Uni.',
      sortOrder: null,
      sortFn: (a: ItemData, b: ItemData) => (a.value || 0) - (b.value || 0),
      sortDirections: ['ascend', 'descend', null],
    },
    {
      name: 'Total',
      sortOrder: null,
      sortFn: (a: ItemData, b: ItemData) => (a.total || 0) - (b.total || 0),
      sortDirections: ['ascend', 'descend', null],
    },
    {
      name: 'Carrinho',
      sortOrder: null,
      sortFn: (a: ItemData, b: ItemData) => (a.cart || '').localeCompare(b.cart || ''),
      sortDirections: ['ascend', 'descend', null],
      filterConfig: {
        listOfFilter: this.getUniqueCarts().map(cart => ({
          text: cart,
          value: cart
        })),
        filterFn: (list: string[], item: ItemData) =>
          list.some(cart => item.cart?.includes(cart)),
        filterMultiple: true
      }
    },
    {
      name: 'Ações',
      sortOrder: null,
      sortFn: null,
      sortDirections: [null],
    }
  ];

  ngOnInit(): void {
    this.loadData();
    this.carregarTotais();

  }

  carrinhosNames: string[] = []
  totaisPorCarrinho: { nome: string, total: number }[] = [];
  totalGeral: number = 0;

  carregarTotais(): void {
    const dadosSalvos = localStorage.getItem('ultimaCompra');
    if (!dadosSalvos) {
      this.totaisPorCarrinho = [];
      this.totalGeral = 0;
      return;
    }

    try {
      const compra = JSON.parse(dadosSalvos);
      const totais: { [key: string]: { nome: string, total: number } } = {};

      let total = 0;

      compra.items.forEach((item: any) => {
        const cartId = item.itm_cart_id;
        const cartName = item.cartName;
        const valorItem = item.itm_total || 0;

        if (!totais[cartId]) {
          totais[cartId] = {
            nome: cartName,
            total: 0
          };
        }

        totais[cartId].total += valorItem;
        total += valorItem;
      });

      this.totaisPorCarrinho = Object.values(totais);
      this.totalGeral = total;

    } catch (error) {
      console.error('Erro ao carregar totais:', error);
      this.totaisPorCarrinho = [];
      this.totalGeral = 0;
    }
  }

  // Atualiza o cache de edição
  updateEditCache(): void {
    this.editCache = {};
    this.tableItems.forEach(item => {
      this.editCache[item.id] = {
        edit: false,
        data: { ...item }
      };
    });
  }

  // Inicia a edição de um item
  startEdit(id: string): void {
    this.editCache[id].edit = true;
    this.limparInputs()
  }

  cancelEdit(id: string): void {
    const index = this.tableItems.findIndex(item => item.id === id);
    this.editCache[id] = {
      data: { ...this.tableItems[index] },
      edit: false
    };
    this.limparInputs()

  }

  saveEdit(id: string): void {
    const index = this.tableItems.findIndex(item => item.id === id);
    Object.assign(this.tableItems[index], this.editCache[id].data);

    this.tableItems[index].total = this.tableItems[index].value * this.tableItems[index].quantity;

    this.updateLocalStorage();

    this.editCache[id].edit = false;
    this.notificationService.success('Sucesso', 'Item atualizado com sucesso');
    this.loadData()

  }

  deleteItem(id: string): void {
    const index = this.tableItems.findIndex(item => item.id === id);
    if (index !== -1) {
      this.tableItems.splice(index, 1);
      this.updateLocalStorage();
      this.loadData()

      this.notificationService.success('Sucesso', 'Item removido com sucesso');
    }
  }

  updateLocalStorage(): void {
    const dadosSalvos = localStorage.getItem('ultimaCompra');
    if (dadosSalvos) {
      const dadosCompra: PurchaseData = JSON.parse(dadosSalvos);

      // Atualiza os itens no localStorage
      dadosCompra.items = this.tableItems.map(item => ({
        id: item.id,
        itm_auth_id: this.user()?.id,
        itm_name: item.name,
        itm_value: item.value,
        itm_quantity: item.quantity,
        itm_total: item.total,
        itm_cart_id: this.getCartIdByName(item.cart)?.toString() || '',
        cartName: item.cart
      }));

      localStorage.setItem('ultimaCompra', JSON.stringify(dadosCompra));

    }
  }

  getCartIdByName(cartName: string): number | undefined {
    const dadosSalvos = localStorage.getItem('ultimaCompra');
    if (dadosSalvos) {
      const dadosCompra: PurchaseData = JSON.parse(dadosSalvos);
      const index = dadosCompra.nomeCarrinhos.indexOf(cartName);
      return index !== -1 ? dadosCompra.cartsIds[index] : undefined;
    }
    return undefined;
  }

  countItems(): number {
    const dadosSalvos = JSON.parse(localStorage.getItem('ultimaCompra') || '{}');
    const total = dadosSalvos?.items?.length || 0;

    return total;
  }

  countTotal(): number {
    const dadosSalvos = JSON.parse(localStorage.getItem('ultimaCompra') || '{}');
    if (!dadosSalvos.items || !Array.isArray(dadosSalvos.items)) {
      return 0;
    }

    const total = dadosSalvos.items.reduce((soma: number, item: any) => {
      return soma + (item.itm_total || 0);
    }, 0);

    return total
  }

  async loadData(): Promise<void> {
    this.carregarTotais()
    if (this.countItems() > 0) {
      this.mostrarTabela = true
    } else {
      this.mostrarTabela = false
    }

    try {
      this.loading = true;
      const currentUser = await this.auth.loadUser();
      const dadosSalvos = localStorage.getItem('ultimaCompra');

      if (!dadosSalvos) {
        console.error('Nenhum dado encontrado no localStorage');
        this.router.navigate(['dashboard']);

        return;
      }

      const dadosCompra: PurchaseData = JSON.parse(dadosSalvos);

      if (dadosCompra.compraFinalizada !== false) {
        console.log('Não há compra em andamento. Redirecionando...');
        this.router.navigate(['dashboard']);
        return;
      }

      this.nomeCarrinhos = dadosCompra.nomeCarrinhos || [];
      this.cartsIds = dadosCompra.cartsIds || [];
      this.mercado = dadosCompra.mercado || '';
      this.purchaseId = dadosCompra.purchaseId;
      this.dataSet = dadosCompra.items || [];

      if (!this.purchaseId || !this.cartsIds.length) {
        console.error('Dados incompletos no localStorage');
        this.router.navigate(['dashboard']);
        return;
      }

      this.tableItems = this.dataSet.map(item => ({
        id: item.id,
        name: item.itm_name,
        value: item.itm_value,
        quantity: item.itm_quantity,
        total: item.itm_total,
        cart: item.cartName
      }));


      this.updateEditCache();
      this.updateCartFilters();

      if (currentUser) {
        this.user.set(currentUser);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      this.message.error('Erro ao carregar dados do usuário');
    } finally {
      this.loading = false;
    }
  }

  getUniqueCarts(): string[] {
    const uniqueCarts = new Set<string>();
    this.tableItems.forEach(item => {
      if (item.cart) {
        uniqueCarts.add(item.cart);
      }
    });
    return Array.from(uniqueCarts).sort();
  }

  updateCartFilters(): void {
    const cartColumn = this.listOfColumns.find(c => c.name === 'Carrinho');
    if (cartColumn?.filterConfig) {
      cartColumn.filterConfig.listOfFilter = this.getUniqueCarts().map(cart => ({
        text: cart,
        value: cart
      }));
    }
  }

  getCartIdSelecionado(): number | null {
    if (!this.carrinhoSelecionado || !this.nomeCarrinhos || !this.cartsIds) {
      return null;
    }

    const index: number = this.nomeCarrinhos.indexOf(this.carrinhoSelecionado);
    return index >= 0 ? this.cartsIds[index] : null;
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

  async createItem(): Promise<void> {
    this.carregarTotais()
    try {
      const cartId: number | null = this.getCartIdSelecionado();

      if (!cartId || this.item == '' || this.valorUnidade == '') {
        this.notificationService.error('Erro', 'Preencha todos os campos!');
        return;
      }

      const cleanedValue: string = this.valorUnidade.replace(/[^\d.,-]/g, '').replace(',', '.');
      const valorUnidade: number = parseFloat(cleanedValue);
      const valorTotal: number = valorUnidade * this.itemQtd;

      const newItem: CartItem = {
        id: this.generateRandomId(),
        itm_auth_id: this.user()?.id,
        itm_name: this.item,
        itm_value: valorUnidade,
        itm_quantity: this.itemQtd,
        itm_total: valorTotal,
        itm_cart_id: cartId.toString(),
        cartName: this.getCartName(cartId.toString())
      };

      const dadosSalvos: string | null = localStorage.getItem('ultimaCompra');

      if (dadosSalvos) {
        const dadosCompra: PurchaseData = JSON.parse(dadosSalvos);
        dadosCompra.items = [...(dadosCompra.items || []), newItem];
        localStorage.setItem('ultimaCompra', JSON.stringify(dadosCompra));

        this.dataSet = dadosCompra.items;
        this.tableItems = this.dataSet.map(item => ({
          id: item.id,
          name: item.itm_name,
          value: item.itm_value,
          quantity: item.itm_quantity,
          total: item.itm_total,
          cart: item.cartName
        }));

        this.updateEditCache(); // Atualiza o cache de edição
        this.updateCartFilters();
      }
      this.loadData()
      this.notificationService.success('Item Adicionado', this.item);
      this.limparInputs();

    } catch (error) {
      console.error('Erro:', error);
      this.notificationService.error('Erro', 'Não foi possível adicionar o item');
    }
  }

  getCartName(cartId: string): string {
    const dadosSalvos: string | null = localStorage.getItem('ultimaCompra');
    if (dadosSalvos) {
      const dadosCompra: PurchaseData = JSON.parse(dadosSalvos);
      const cartIdsAsStrings: string[] = dadosCompra.cartsIds.map(id => id.toString());
      const index: number = cartIdsAsStrings.indexOf(cartId);
      return index !== -1 ? dadosCompra.nomeCarrinhos[index] : 'Desconhecido';
    }
    return 'Desconhecido';
  }

  limparInputs(): void {
    this.item = '';
    this.valorUnidade = '';
    this.itemQtd = 1;
    this.valorTotal = 0;
    this.valorUnidadeRaw = 0;
  }

  isVisibleMercado = false;

  showModalMercado(): void {
    this.isVisibleMercado = true;
  }

  handleOkMercado(): void {
    this.updateMercado()
  }

  handleCancelMercado(): void {
    this.isVisibleMercado = false;
  }

  isVisibleCarrinho = false

  showModalCarrinho(): void {
    this.isVisibleCarrinho = true;
    const dadosSalvos: string | null = localStorage.getItem('ultimaCompra');
    if (dadosSalvos) {
      const dadosCompra: PurchaseData = JSON.parse(dadosSalvos);
      const cartIdsAsStrings: string[] = dadosCompra.cartsIds.map(id => id.toString());
      const cartsNames = dadosCompra.nomeCarrinhos.map(id => id)

      this.carts = dadosCompra.cartsIds.map((id, index) => ({
        id: id.toString(),
        nome: dadosCompra.nomeCarrinhos[index] || ''
      }));
    }
  }

  handleOkCarrinhos(): void {
    this.updateCarrinhos()
  }

  handleCancelCarrinhos(): void {
    this.isVisibleCarrinho = false;
  }

  carts: { id: string; nome: string }[] = [];

  async updateCarrinhos() {
    this.LoadingService.startLoading();

    const dadosSalvos = localStorage.getItem('ultimaCompra');
    if (dadosSalvos) {
      const dadosCompra: PurchaseData = JSON.parse(dadosSalvos);

      // Mapeia os novos nomes para referência rápida
      const novosNomesMap: { [key: string]: string } = {};

      for (let i = 0; i < this.carts.length; i++) {
        const cartId = this.carts[i].id;
        const novoNome = this.carts[i].nome;

        // Atualiza o mapa de nomes
        novosNomesMap[cartId] = novoNome;

        // Atualiza no array nomeCarrinhos
        dadosCompra.nomeCarrinhos[i] = novoNome;

        // Atualiza no Supabase
        const { error } = await this.supabase
          .from('car_carts')
          .update({ car_name: novoNome })
          .eq('car_id', cartId);

        if (error) {
          console.error(`Erro ao atualizar carrinho ID ${cartId}:`, error);
        }
      }

      // Atualiza os nomes dos carrinhos nos itens da tabela
      this.tableItems.forEach(item => {
        const cartId = this.getCartIdByName(item.cart)?.toString();
        if (cartId && novosNomesMap[cartId]) {
          item.cart = novosNomesMap[cartId];
        }
      });

      // Atualiza os itens no localStorage
      dadosCompra.items = this.tableItems.map(item => ({
        id: item.id,
        itm_auth_id: this.user()?.id,
        itm_name: item.name,
        itm_value: item.value,
        itm_quantity: item.quantity,
        itm_total: item.total,
        itm_cart_id: this.getCartIdByName(item.cart)?.toString() || '',
        cartName: item.cart
      }));

      // Salva no localStorage
      localStorage.setItem('ultimaCompra', JSON.stringify(dadosCompra));

      // Atualiza os filtros da tabela
      this.updateCartFilters();
      // Atualiza o cache de edição
      this.updateEditCache();
      // Atualiza os totais
      this.carregarTotais();
    }
    this.loadData()

    this.LoadingService.stopLoading();
    this.notificationService.success('Carrinhos atualizados com sucesso!', '');
    this.isVisibleCarrinho = false;
  }


  async updateMercado() {
    this.LoadingService.startLoading()

    const dadosSalvos = localStorage.getItem('ultimaCompra');
    if (dadosSalvos) {
      const dadosCompra: PurchaseData = JSON.parse(dadosSalvos);
      dadosCompra.mercado = this.mercado
      dadosCompra.dataCompra = this.dataCompra
      localStorage.setItem('ultimaCompra', JSON.stringify(dadosCompra));

      const { data, error } = await this.supabase
        .from('pur_purchase')
        .update({
          pur_market_name: this.mercado,
          pur_date: this.dataCompra
        })
        .eq('pur_id', dadosCompra.purchaseId)

    }
    this.LoadingService.stopLoading()
    this.notificationService.success('Alteração Realizada', "")
    this.handleCancelMercado()
  }

  onValorChangeTable(value: string): void {
    const numeros: string = String(value).replace(/\D/g, '');

    if (!numeros) {
      this.valorUnidade = '';
      this.valorUnidadeRaw = 0;
      this.valorTotal = 0;
      return;
    }

    const centavos: number = parseFloat(numeros) / 100;
    this.valorUnidadeRaw = centavos;

    this.valorUnidade = `R$ ${centavos.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
    this.limparInputs()
    this.calcularValorTotal();
  }

  onValorChange(value: string): void {
    const numeros: string = String(value).replace(/\D/g, '');

    if (!numeros) {
      this.valorUnidade = '';
      this.valorUnidadeRaw = 0;
      this.valorTotal = 0;
      return;
    }

    const centavos: number = parseFloat(numeros) / 100;
    this.valorUnidadeRaw = centavos;

    this.valorUnidade = `R$ ${centavos.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

    this.calcularValorTotal();
  }

  calcularValorTotal(): void {
    this.valorTotal = this.valorUnidadeRaw * this.itemQtd;
  }

  async finalizarCompra() {
    try {
      const dadosSalvos = localStorage.getItem('ultimaCompra');
      if (!dadosSalvos) {
        this.notificationService.error('Erro', 'Nenhuma compra encontrada');
        return;
      }

      const dadosCompra: PurchaseData = JSON.parse(dadosSalvos);

      if (!dadosCompra.items || dadosCompra.items.length === 0) {
        this.notificationService.warning('Aviso', 'Nenhum item para salvar');
        return;
      }
      this.LoadingService.startLoading()

      for (let i = 0; i < dadosCompra.items.length; i++) {
        const { data, error } = await this.supabase
          .from('itm_item')
          .insert([
            {
              itm_name: dadosCompra.items[i].itm_name,
              itm_value: dadosCompra.items[i].itm_value,
              itm_quantity: dadosCompra.items[i].itm_quantity,
              itm_total: dadosCompra.items[i].itm_total,
              itm_cart_id: dadosCompra.items[i].itm_cart_id,
              itm_auth_id: this.user()?.id
            },
          ])
      }

      const { data, error } = await this.supabase
        .from('pur_purchase')
        .update({ pur_state: true })
        .eq('pur_id', dadosCompra.purchaseId)


      this.notificationService.success('Sucesso', 'Compra salva com sucesso');
      if (localStorage.getItem('ultimaCompra')) {
        localStorage.removeItem('ultimaCompra');
      }
      this.LoadingService.stopLoading()

      this.router.navigate(['/'])

    } catch (error) {
      console.error('Erro ao preparar dados:', error);
      this.notificationService.error('Erro', 'Falha ao preparar dados para envio');
    }
  }

  voltar() {
    this.LoadingService.startLoading()
    this.router.navigate(['dashboard'])
    this.LoadingService.stopLoading()
  }
  constructor(private modal: NzModalService) { }

  showDeleteConfirm(): void {
    this.modal.confirm({
      nzTitle: '<i>Você tem certeza que quer cancelar essa compra?</i>',
      nzContent: '<b style="color: red;">Todos os itens dessa compra serão deletados e não será possível recuperá-los...</b>',
      nzOkText: 'Cancelar Compra',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.cancelPurchase(),
      nzCancelText: 'Voltar',
      nzOnCancel: () => ''
    });
  }

  async cancelPurchase() {
    this.LoadingService.startLoading()
    try {

      const { error } = await this.supabase
        .from('pur_purchase')
        .delete()
        .eq('pur_id', this.purchaseId)
      this.notificationService.success('Compra Cancelada', 'Sua compra foi cancelada com sucesso!')
      localStorage.removeItem('ultimaCompra');
      this.router.navigate(['dashboard'])
    }
    catch {
      this.notificationService.error('Erro', 'Não foi possível cancelar sua compra!')
    }
    //this.router.navigate(['dashboard'])
    this.LoadingService.stopLoading()
  }
}