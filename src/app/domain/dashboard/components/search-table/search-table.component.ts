import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SearchItemData } from '@domain/dashboard/interfaces/searchItemData';
import { injectSupabase } from '@shared/functions/inject-supabase.function';
import { LoadingService } from '@shared/services/loading/loading.service';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinComponent } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-search-table',
  templateUrl: './search-table.component.html',
  styleUrls: ['./search-table.component.css'],
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
    NzSpinComponent
  ],
})

export class SearchTable implements OnInit {
  protected LoadingService = inject(LoadingService);
  private supabase = injectSupabase();

  termoPesquisa: string = ''
  searchItems: SearchItemData[] = []
  loading = false;

  constructor() { }

  ngOnInit() {
  }

  async pesquisarItem() {
    this.loading = true; // Ativa o loading
    this.searchItems = []

    this.LoadingService.startLoading()
    try {
      const termo = this.termoPesquisa.trim().toLowerCase();
      const { data, error } = await this.supabase
        .from('itm_item')
        .select(`
        *,
        car_carts:itm_cart_id (
          car_purchase_id,
          pur_purchase:car_purchase_id (
            pur_date, pur_market_name
          )
        )`)
        .ilike('itm_name', `%${termo}%`);

      if (data) {
        for (let i = 0; i < data.length; i++) {
          this.searchItems[i] = {
            date: data[i].car_carts.pur_purchase.pur_date,
            name: data[i].itm_name,
            price: data[i].itm_value,
            place: data[i].car_carts.pur_purchase.pur_market_name
          };
        }
      }
    }
    catch (error) {
      console.error('Erro ao buscar itens:', error);
    } finally {
      this.loading = false;
      this.LoadingService.stopLoading()

    }

  }
}