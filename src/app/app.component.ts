import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  //o template de rotas é o routerOutlet, as rotas serão definidas no app.routes
  template: '<router-outlet></router-outlet>',
})
export class AppComponent {
//Não criar nada aqui
}
