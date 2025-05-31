import { Component, ElementRef, HostListener, inject, OnInit, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import { AuthService } from '@domain/auth/services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Data, Router } from '@angular/router';
import { iUser } from '@domain/auth/interfaces/user.interface';
import { CommonModule } from '@angular/common';
import { LoadingService } from '@shared/services/loading/loading.service';
import { NzTableFilterFn, NzTableFilterList, NzTableModule, NzTableSortFn, NzTableSortOrder } from 'ng-zorro-antd/table';
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
import { map } from 'rxjs';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardComponent } from 'ng-zorro-antd/card';
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
  @ViewChildren('inputEl') inputElements!: QueryList<ElementRef>;

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
  loadingSearchButton = false
  termoPesquisa: string = ''
  loadingTable = false;

  valorUnidade: string = '';
  itemQtd: number = 1;
  valorTotal: number = 0;
  valorUnidadeRaw: number = 0;
  tableItems: any[] = [];
  mostrarTabela: boolean = false
  // Cache para edição
  editCache: { [key: string]: { edit: boolean; data: ItemData } } = {};
  currentPurchaseId: any
  purchaseIdFromHistory: string = ''
  isNewPurchase: boolean = false;


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
      name: 'Valor',
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
      name: 'Categoria',
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

  tempListCategory: { nome: string, id: string }[] = [];
  listCategory: { nome: string, id: string }[] = [];

  categoriaSelecionada: string = ''

  isMobile = window.innerWidth < 770;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isMobile = event.target.innerWidth < 770;
  }

  async ngOnInit(): Promise<void> {
    // 1. Verifica se veio do histórico
    this.currentPurchaseId = history.state.purchaseId || null;
    if (this.currentPurchaseId == null) {
      const purchases = localStorage.getItem('purchases');
      if (!purchases) return;

      const currentPurchase = JSON.parse(purchases).find((p: any) => p.currentPurchase);
      if (!currentPurchase) return;

      this.currentPurchaseId = currentPurchase.purchaseId;
    }

    await this.loadData();       // 1. Carrega dados básicos e define currentPurchaseId
    await this.carregarTotais(); // 2. Agora pode carregar totais com ID conhecido
    await this.loadTable();      // 3. Carrega itens da tabela

  }

  carrinhosNames: string[] = []
  totaisPorCarrinho: { nome: string, total: number }[] = [];
  totalGeral: number = 0;

  async carregarTotais(): Promise<void> {
    try {
      // 1. Verificar se temos uma compra atual
      if (!this.currentPurchaseId) {
        const purchases = localStorage.getItem('purchases');
        if (purchases) {
          const currentPurchase = JSON.parse(purchases).find((p: any) => p.currentPurchase);
          this.currentPurchaseId = currentPurchase?.purchaseId;
        }

        if (!this.currentPurchaseId) {
          this.totaisPorCarrinho = [];
          this.totalGeral = 0;
          return;
        }
      }

      // 2. Buscar todos os itens da compra atual com JOIN
      const { data, error } = await this.supabase
        .from('car_carts')
        .select(`
        car_id,
        car_name,
        itm_item(
          itm_total
        )
      `)
        .eq('car_purchase_id', this.currentPurchaseId);

      if (error) throw error;

      // 3. Calcular totais
      const totais: { nome: string; total: number }[] = [];
      let totalGeral = 0;

      if (data && data.length > 0) {
        // this.mostrarTabela = true
        data.forEach((cart: any) => {
          let totalCarrinho = 0;

          // Soma os itens de cada carrinho
          if (cart.itm_item && cart.itm_item.length > 0) {
            totalCarrinho = cart.itm_item.reduce(
              (sum: number, item: any) => sum + (item.itm_total || 0), 0
            );
          }

          totais.push({
            nome: cart.car_name,
            total: totalCarrinho
          });

          totalGeral += totalCarrinho;
        });
      }

      // 4. Atualizar estado
      this.totaisPorCarrinho = totais;
      this.totalGeral = totalGeral;

    } catch (error) {
      console.error('Erro ao carregar totais:', error);
      this.totaisPorCarrinho = [];
      this.totalGeral = 0;
      this.notificationService.error('Erro', 'Falha ao calcular totais');
    }
  }

  updateEditCache(): void {
    this.editCache = {};

    this.tableItems.forEach(item => {
      const itemId = String(item.id); // <-- conversão aqui
      this.editCache[itemId] = {
        edit: false,
        data: JSON.parse(JSON.stringify({
          id: item.id, // ainda pode ser number aqui
          name: item.name,
          value: item.value || 0,
          quantity: item.quantity || 1,
          total: item.total || 0,
          cart: item.cart || this.listCategory[0]?.nome || ''
        }))
      };
    });
  }

  startEdit(id: number | string): void {
    const key = String(id); // garante string como chave

    Object.keys(this.editCache).forEach(k => {
      if (this.editCache[k].edit && k !== key) {
        this.cancelEdit(k);
      }
    });

    if (this.editCache[key]) {
      this.editCache[key].edit = true;
    }
  }

  // Cancela a edição - MELHORADO
  cancelEdit(id: string): void {
    const originalItem = this.tableItems.find(item => item.id === id);
    if (originalItem && this.editCache[id]) {
      this.editCache[id] = {
        edit: false,
        data: { ...originalItem } // Restaura os dados originais
      };
    }
  }

  updateItemTotal(itemId: string): void {
    if (this.editCache[itemId] && this.editCache[itemId].data) {
      const item = this.editCache[itemId].data;
      const value = Number(item.value) || 0;
      const quantity = Number(item.quantity) || 1;
      item.total = value * quantity;
    }
  }

  // Salva as alterações - PRINCIPAL MELHORIA
  async saveEdit(id: string): Promise<void> {
    try {
      this.LoadingService.startLoading();

      // Verifica se o item existe
      const index = this.tableItems.findIndex(item => item.id === id);
      if (index === -1 || !this.editCache[id]) {
        this.notificationService.error('Erro', 'Item não encontrado');
        return;
      }
      this.updateItemTotal(id);

      const editedItem = this.editCache[id].data;

      // Validações
      if (!editedItem.name || editedItem.name.trim() === '') {
        this.notificationService.error('Erro', 'O nome do item é obrigatório');
        return;
      }

      if (!editedItem.cart || editedItem.cart.trim() === '') {
        this.notificationService.error('Erro', 'Selecione uma categoria');
        return;
      }

      const safeQuantity = Number(editedItem.quantity) || 1;
      if (safeQuantity <= 0) {
        this.notificationService.error('Erro', 'A quantidade deve ser maior que zero');
        return;
      }

      // Formata o valor corretamente
      let safeValue = 0;
      if (editedItem.value !== null && editedItem.value !== undefined) {
        const valueAsString = String(editedItem.value); // Converte para string garantidamente
        safeValue = parseFloat(valueAsString.replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
      } else {
        safeValue = 0;
      }
      if (safeValue <= 0) {
        this.notificationService.error('Erro', 'O valor unitário deve ser maior que zero');
        return;
      }

      const calculatedTotal = safeValue * safeQuantity;
      const cartId = this.getCartIdByName(editedItem.cart);

      if (!cartId) {
        this.notificationService.error('Erro', 'Categoria inválida');
        return;
      }

      // Atualiza no Supabase
      const { error } = await this.supabase
        .from('itm_item')
        .update({
          itm_name: editedItem.name.trim(),
          itm_value: safeValue,
          itm_quantity: safeQuantity,
          itm_total: calculatedTotal,
          itm_cart_id: cartId
        })
        .eq('itm_id', id);

      if (error) throw error;

      // Atualiza localmente
      this.tableItems[index] = {
        ...this.tableItems[index],
        name: editedItem.name.trim(),
        value: safeValue,
        quantity: safeQuantity,
        total: calculatedTotal,
        cart: editedItem.cart
      };

      this.editCache[id].edit = false;

      // Atualiza totais e filtros
      await this.carregarTotais();
      this.updateCartFilters();

      this.notificationService.success('Sucesso', 'Item atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao salvar edição:', error);
      this.notificationService.error('Erro', 'Falha ao atualizar item');
      this.cancelEdit(id);
    } finally {
      this.LoadingService.stopLoading();
    }
  }

  // Exclui um item
  async deleteItem(id: string): Promise<void> {
    try {
      this.LoadingService.startLoading();

      // Remove do Supabase
      const { error } = await this.supabase
        .from('itm_item')
        .delete()
        .eq('itm_id', id);

      if (error) throw error;

      // Remove localmente
      const index = this.tableItems.findIndex(item => item.id === id);
      if (index !== -1) {
        this.tableItems.splice(index, 1);
        delete this.editCache[id];
      }

      // Atualiza totais e filtros
      await this.carregarTotais();
      this.updateCartFilters();

      this.notificationService.success('Sucesso', 'Item removido com sucesso');
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      this.notificationService.error('Erro', 'Falha ao remover item');
    } finally {
      this.LoadingService.stopLoading();
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

    try {
      const user = this.auth.currentUser();
      if (!user) return;


      const { data: purchaseDBData, error } = await this.supabase
        .from('pur_purchase')
        .select(`*, car_carts(*, itm_item(*))`)
        .eq('pur_id', this.currentPurchaseId);

      if (error) throw error;
      if (!purchaseDBData) return;

      const purchaseData = purchaseDBData[0];

      const purchaseDateUtc = new Date(purchaseData.pur_date);
      const purchaseDateLocal = new Date(
        purchaseDateUtc.getUTCFullYear(),
        purchaseDateUtc.getUTCMonth(),
        purchaseDateUtc.getUTCDate()
      );
      this.dataCompra = purchaseDateLocal;

      this.mercado = purchaseData.pur_market_name;
      this.listCategory = purchaseData.car_carts.map((cart: any) => ({
        nome: cart.car_name,
        id: cart.car_id.toString()
      }));
      this.qtdCarrinhos = this.listCategory.length
    } catch (error) {
      console.error('Erro no loadData:', error);
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

  // Atualiza os filtros da coluna Categoria
  updateCartFilters(): void {
    const cartColumnIndex = this.listOfColumns.findIndex(c => c.name === 'Categoria');
    if (cartColumnIndex >= 0) {
      // Usa as categorias da listCategory em vez dos itens da tabela
      const uniqueCarts = this.listCategory.map(c => c.nome);
      this.listOfColumns[cartColumnIndex] = {
        ...this.listOfColumns[cartColumnIndex],
        filterConfig: {
          listOfFilter: uniqueCarts.map(cart => ({
            text: cart,
            value: cart
          })),
          filterFn: (list: string[], item: ItemData) =>
            list.some(cart => item.cart?.includes(cart)),
          filterMultiple: true
        }
      };
    }
  }

  getCartIdByName(cartName: string): number | null {
    const cart = this.listCategory.find(c => c.nome === cartName);
    return cart?.id ? parseInt(cart.id) : null;
  }

  //PEGA O ID DO CARRINHO SELECIONADO, FUNCIONA NA VERSAO ATUAL
  getCartIdSelecionado(): number | null {
    if (!this.categoriaSelecionada || !this.nomeCarrinhos || !this.cartsIds) {
      return null;
    }

    const index: number = this.nomeCarrinhos.indexOf(this.categoriaSelecionada);
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

  async loadTable() {
    if (!this.currentPurchaseId) return;

    const { data: itm_item, error } = await this.supabase
      .from('itm_item')
      .select('*, car_carts!inner(*)')
      .eq('car_carts.car_purchase_id', this.currentPurchaseId);

    if (error) {
      console.error('Erro ao carregar itens:', error);
      return;
    }

    if (itm_item && itm_item.length > 0) {
      this.tableItems = itm_item.map(item => ({
        id: item.itm_id,
        name: item.itm_name,
        value: item.itm_value,
        quantity: item.itm_quantity,
        total: item.itm_total,
        cart: item.car_carts?.car_name
      }));

      this.mostrarTabela = true;
      this.updateEditCache();
      this.updateCartFilters(); // Atualiza os filtros após carregar os itens
    } else {
      this.mostrarTabela = false;
      this.tableItems = [];
      this.updateCartFilters(); // Atualiza os filtros mesmo sem itens
    }
  }

  trackById(index: number, item: any): any {
    return item.id;
  }

  async createItem(): Promise<void> {
    try {

      if (!this.categoriaSelecionada || this.item == '' || this.valorUnidade == '') {
        this.notificationService.error('Erro', 'Preencha todos os campos!');
        return;
      }

      // Remove todos os caracteres não numéricos exceto vírgula e ponto
      const cleanedValue = this.valorUnidade.replace(/[^\d,]/g, '');

      // Substitui vírgula por ponto e remove pontos de milhar
      const numericString = cleanedValue.replace('.', '').replace(',', '.');
      const valorUnidade = parseFloat(numericString); // 1000.00
      const valorTotal = valorUnidade * this.itemQtd;

      const { data, error } = await this.supabase
        .from('itm_item')
        .insert([
          {
            itm_name: this.item,
            itm_value: valorUnidade,
            itm_quantity: this.itemQtd,
            itm_total: valorTotal,
            itm_cart_id: this.categoriaSelecionada,
            itm_auth_id: this.auth.currentUser()?.id,
          },
        ])
        .select()

      this.notificationService.success('Item Adicionado', this.item);
      this.limparInputs();
      this.loadTable()
      this.carregarTotais()
    } catch {

    } finally {

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

  // showModalCarrinho(): void {
  //   this.isVisibleCarrinho = true;
  //   this.tempListCategory = this.listCategory
  //   console.log('temp', this.tempListCategory)
  // }

  handleOkCarrinhos(): void {
    this.updateCarrinhos()
  }

  handleCancelCarrinhos(): void {
    this.isVisibleCarrinho = false;
  }

  async updateCarrinhos() {
    this.LoadingService.startLoading();

    try {
      // Cria mapas para facilitar a comparação
      const oldItemsMap = new Map(this.tempListCategory.map(item => [item.id, item]));
      const newItemsMap = new Map(this.listCategory.map(item => [item.id, item]));

      // Arrays para armazenar as operações
      const inserts = [];
      const updates = [];
      const deletes = [];

      // Identificar itens para inserção (novos) ou atualização (modificados)
      for (const newItem of this.listCategory) {
        if (newItem.id === "") {
          // Novo item (inserção)
          inserts.push(newItem);
        } else {
          const oldItem = oldItemsMap.get(newItem.id);
          if (oldItem && oldItem.nome !== newItem.nome) {
            // Item modificado (atualização)
            updates.push(newItem);
          }
        }
      }

      // Identificar itens para exclusão (removidos da lista)
      for (const oldItem of this.tempListCategory) {
        if (oldItem.id !== "" && !newItemsMap.has(oldItem.id)) {
          deletes.push(oldItem.id);
        }
      }

      // Executar operações de inserção
      for (const item of inserts) {
        const { error } = await this.supabase
          .from('car_carts')
          .insert({
            car_name: item.nome,
            car_auth_id: this.auth.currentUser()?.id,
            car_purchase_id: this.currentPurchaseId
          });
        if (error) throw error;
      }

      // Executar operações de atualização
      for (const item of updates) {
        const { error } = await this.supabase
          .from('car_carts')
          .update({ car_name: item.nome })
          .eq('car_id', item.id);
        if (error) throw error;
      }

      // Executar operações de exclusão
      if (deletes.length > 0) {
        const { error } = await this.supabase
          .from('car_carts')
          .delete()
          .in('car_id', deletes);
        if (error) throw error;
      }

      // Atualizar a interface
      this.loadData();
      this.loadTable();
      this.updateCartFilters();
      this.updateEditCache();
      this.carregarTotais();


      this.notificationService.success('Carrinhos atualizados com sucesso!', '');
      this.isVisibleCarrinho = false;

    } catch (error) {
      console.error('Erro ao atualizar carrinhos:', error);
      this.notificationService.error('Não foi possível alterar', '');

    } finally {
      this.LoadingService.stopLoading();
      this.isVisibleCarrinho = false;
    }
  }

  showModalCarrinho(): void {
    this.isVisibleCarrinho = true;
    // Cria uma cópia profunda da lista atual para comparação posterior
    this.tempListCategory = JSON.parse(JSON.stringify(this.listCategory));
  }
  // async updateCarrinhos() {
  //   this.LoadingService.startLoading();

  //   try {
  //     console.log('list', this.listCategory)


  //     for (let i = 0; i < this.listCategory.length; i++) {
  //       if (this.listCategory[i].id == "") {
  //         const { error: insertError } = await this.supabase
  //           .from('car_carts')
  //           .insert({
  //             car_name: this.listCategory[i].nome,
  //             car_auth_id: this.auth.currentUser()?.id,
  //             car_purchase_id: this.currentPurchaseId
  //           })
  //       } else {
  //         const { data, error } = await this.supabase
  //           .from('car_carts')
  //           .update({
  //             car_name: this.listCategory[i].nome
  //           })
  //           .eq('car_id', this.listCategory[i].id)
  //       }
  //     }

  //     this.loadData()
  //     this.loadTable()
  //     // Atualiza os filtros da tabela
  //     this.updateCartFilters();
  //     // Atualiza o cache de edição
  //     this.updateEditCache();
  //     // Atualiza os totais
  //     this.carregarTotais();
  //     this.LoadingService.stopLoading();
  //     this.notificationService.success('Carrinhos atualizados com sucesso!', '');
  //     this.isVisibleCarrinho = false;
  //   } catch {
  //     this.notificationService.error('Não foi possivel alterar', '');

  //   } finally {
  //     this.isVisibleCarrinho = false;
  //   }
  // }

  onQtdCarrinhosChange(newValue: number) {
    const currentLength = this.listCategory.length;

    if (newValue > currentLength) {

      for (let i = currentLength; i < newValue; i++) {
        this.listCategory.push({
          nome: '',
          id: '',
        });
      }
    } else if (newValue < currentLength) {
      this.listCategory.length = newValue;
    }
  }

  async updateMercado() {
    this.LoadingService.startLoading()

    try {

      const { data, error } = await this.supabase
        .from('pur_purchase')
        .update({
          pur_market_name: this.mercado,
          pur_date: this.dataCompra
        })
        .eq('pur_id', this.currentPurchaseId)
      this.notificationService.success('Alteração Realizada', "")
      this.LoadingService.stopLoading()
      this.handleCancelMercado()
    } catch {
      this.notificationService.error('Não foi possível alterar', "")
      this.LoadingService.stopLoading()
    } finally {
      this.LoadingService.stopLoading()
    }
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
      this.LoadingService.startLoading()
      const { data, error } = await this.supabase
        .from('pur_purchase')
        .update({ pur_state: true })
        .eq('pur_id', this.currentPurchaseId)

      this.notificationService.success('Sucesso', 'Compra salva com sucesso');
      this.LoadingService.stopLoading()
      this.router.navigate(['/'])

      // const dadosSalvos = localStorage.getItem('ultimaCompra');
      // if (!dadosSalvos) {
      //   this.notificationService.error('Erro', 'Nenhuma compra encontrada');
      //   return;
      // }

      // const dadosCompra: PurchaseData = JSON.parse(dadosSalvos);

      // if (!dadosCompra.items || dadosCompra.items.length === 0) {
      //   this.notificationService.warning('Aviso', 'Nenhum item para salvar');
      //   return;
      // }

      // for (let i = 0; i < dadosCompra.items.length; i++) {
      //   const { data, error } = await this.supabase
      //     .from('itm_item')
      //     .insert([
      //       {
      //         itm_name: dadosCompra.items[i].itm_name,
      //         itm_value: dadosCompra.items[i].itm_value,
      //         itm_quantity: dadosCompra.items[i].itm_quantity,
      //         itm_total: dadosCompra.items[i].itm_total,
      //         itm_cart_id: dadosCompra.items[i].itm_cart_id,
      //         itm_auth_id: this.user()?.id
      //       },
      //     ])
      // }

      // const { data, error } = await this.supabase
      //   .from('pur_purchase')
      //   .update({ pur_state: true })
      //   .eq('pur_id', dadosCompra.purchaseId)


      // this.notificationService.success('Sucesso', 'Compra salva com sucesso');
      // if (localStorage.getItem('ultimaCompra')) {
      //   localStorage.removeItem('ultimaCompra');
      // }


    } catch (error) {
      console.error('Erro ao preparar dados:', error);
      this.notificationService.error('Erro', 'Falha ao preparar dados para envio');
    }
  }

  // voltar() {
  //   this.LoadingService.startLoading()
  //   this.router.navigate(['dashboard'])
  //   this.LoadingService.stopLoading()
  // }

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
        .eq('pur_id', this.currentPurchaseId)
      this.notificationService.success('Compra Cancelada', 'Sua compra foi cancelada com sucesso!')
      //localStorage.removeItem('ultimaCompra');


      // Recupera o array do localStorage
      const stored = localStorage.getItem('purchases');
      if (stored) {
        const compras = JSON.parse(stored);
        const atualizadas = compras.filter((item: any) => item.purchaseId !== this.currentPurchaseId);
        localStorage.setItem('purchases', JSON.stringify(atualizadas));
      }

      //localStorage.removeItem('ultimaCompra');

      this.router.navigate(['dashboard'])
    }
    catch {
      this.notificationService.error('Erro', 'Não foi possível cancelar sua compra!')
    }
    //this.router.navigate(['dashboard'])
    this.LoadingService.stopLoading()
  }

  async pesquisarItem() {
    this.loadingSearchButton = true; // Ativa o loading
    this.tableItems = []
    this.loadingTable = true
    this.LoadingService.startLoading()
    try {
      const termo = this.termoPesquisa.trim().toLowerCase();

      // Busca os carrinhos da compra atual
      const { data: carts, error: cartError } = await this.supabase
        .from('car_carts')
        .select('car_id')
        .eq('car_purchase_id', this.currentPurchaseId);

      const cartIds = carts?.map(c => c.car_id) ?? [];

      // Busca os itens dos carrinhos filtrados
      const { data: items, error: itemError } = await this.supabase
        .from('itm_item')
        .select(`
            *,
            car_carts:itm_cart_id (
              car_id,
              car_name,
              car_purchase_id,
              pur_purchase:car_purchase_id (
                pur_date,
                pur_market_name
              )
            )
          `)
        .in('itm_cart_id', cartIds)
        .ilike('itm_name', `%${termo}%`);

      console.log(items);

      if (items) {
       this.tableItems = items.map(item => ({
        id: item.itm_id,
        name: item.itm_name,
        value: item.itm_value,
        quantity: item.itm_quantity,
        total: item.itm_total,
        cart: item.car_carts?.car_name
      }));

        console.log(this.tableItems);
      }

    }
    catch (error) {
      console.error('Erro ao buscar itens:', error);
    } finally {
      this.loadingSearchButton = false;
      this.LoadingService.stopLoading()
      this.loadingTable = false
    }

  }

}