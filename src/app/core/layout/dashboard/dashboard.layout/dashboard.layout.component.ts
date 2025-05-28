import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
@Component({
  selector: 'app-dashboard.layout',
  templateUrl: './dashboard.layout.component.html',
  styleUrls: ['./dashboard.layout.component.css'],
  imports: [RouterModule, NzBreadCrumbModule, NzIconModule, NzMenuModule, NzLayoutModule, NgClass],

})
export class DashboardLayoutComponent {
  isCollapsed = true;

  toggleSider(): void {
    this.isCollapsed = !this.isCollapsed;
  }

}
