import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  loading = signal<boolean>(false);

  startLoading(){
    this.loading.set(true);
  }

  stopLoading(){
    this.loading.set(false);
  }

}
// resposável por mostrar paginas de carregamento de dados