import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { iUser } from '@domain/auth/interfaces/user.interface';
import { AuthService } from '@domain/auth/services/auth.service';
import { ColumnItem } from '@domain/dashboard/interfaces/ColumnItem';
import { ItemData } from '@domain/dashboard/interfaces/ItemData';
import { injectSupabase } from '@shared/functions/inject-supabase.function';
import { SupabaseClient } from '@supabase/supabase-js';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-open-purcases.page',
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
    NzGridModule
  ]
})
export class OpenPurchases implements OnInit {
  private supabase = injectSupabase();
  private auth = inject(AuthService);
  private message = inject(NzMessageService);
  purchaseDatas: any[] = []
  user = signal<iUser | null>(null);

  constructor() { }

  ngOnInit() {
    this.loadPurchases()
  }

  async loadPurchases() {
    const currentUser = await this.auth.loadUser();
    if (currentUser) {
      this.user.set(currentUser);

      let { data: pur_purchase, error } = await this.supabase
        .from('pur_purchase')
        .select('*')
        .eq('pur_auth_id', this.user()?.id)
   

      console.log(pur_purchase)
    } else {
      this.message.error('Sessão inválida. Faça login novamente.');
    }


  }


}
