import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SearchTableComponent } from '@domain/dashboard/components/search-table/search-table.component';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { FormsModule } from '@angular/forms';

describe('SearchTableComponent', () => {
  let component: SearchTableComponent;
  let fixture: ComponentFixture<SearchTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        NzTableModule,
        NzInputModule,
        NzButtonModule,
        NzSpinModule,
        SearchTableComponent // Importando o componente standalone
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Adicione mais testes conforme necessário
});

export { SearchTableComponent };
