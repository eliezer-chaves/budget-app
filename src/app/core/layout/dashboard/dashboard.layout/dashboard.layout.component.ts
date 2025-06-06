import { NgClass } from '@angular/common';
import { Component, ElementRef, HostListener, inject, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@domain/auth/services/auth.service';
import { injectSupabase } from '@shared/functions/inject-supabase.function';

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
  private router = inject(Router);
  private supabase = injectSupabase();
  private auth = inject(AuthService);
  isCollapsed = true;

  constructor(private elementRef: ElementRef) { }


  toggleSider(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  openPurchases() {
    this.router.navigate(['dashboard/orcamentos-abertos']);
    this.toggleSider()
  }

  goToProfile() {
    this.router.navigate(['profile']);
    this.toggleSider()
  }

  goToHome() {
    this.router.navigate(['dashboard']);
    this.toggleSider()
  }

  @ViewChild('sider') siderRef!: ElementRef;
  @ViewChild('trigger') triggerRef!: ElementRef;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as Node;

    const clickedSider = this.siderRef?.nativeElement?.contains(target) ?? false;
    const clickedTrigger = this.triggerRef?.nativeElement?.contains(target) ?? false;

    if (!clickedSider && !clickedTrigger && !this.isCollapsed) {
      this.isCollapsed = true;
    }
  }

  async logout() {
    this.auth.purgeAndRedirect()
    this.router.navigate(['auth']);
  }
}
