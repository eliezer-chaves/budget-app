import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { iUser } from '@domain/auth/interfaces/user.interface';
import { injectSupabase } from '@shared/functions/inject-supabase.function';
import { WritableSignal } from '@angular/core';
import { LoadingService } from '../../../shared/services/loading/loading.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Injectable({
    providedIn: "root",
})
export class AuthService {
    private supabase = injectSupabase();
    private router = inject(Router);
    private LoadingService = inject(LoadingService)
    private notificationService = inject(NzNotificationService);

    currentUser: WritableSignal<iUser | null> = signal(null);
    isLoggedInGuard = signal<boolean>(false);

    async loadUser(): Promise<iUser | null> {
        const { data, error } = await this.supabase.auth.getSession();

        // Se houver erro ou não houver sessão, retorna null
        if (error || !data?.session || !data.session.user) {
            await this.purgeAndRedirect();
            this.isLoggedInGuard.set(false);
            return null;
        }

        const user = data.session.user;
        const metadata = (user as any).user_metadata ?? (user as any).raw_user_meta_data;

        // Criar um objeto com as informações do usuário conforme sua interface
        const userData: iUser = {
            id: user.id,
            email: user.email ?? '',
            phone: metadata?.phone ?? '',
            full_name: metadata?.full_name ?? '',
            avatar_url: metadata?.avatar_url ?? '',
        };

        this.currentUser.set(userData); // Atualiza o estado com os dados do usuário
        this.isLoggedInGuard.set(true); // Marca que o usuário está logado
        return userData; // Retorna os dados do usuário
    }


    async signUpWithEmail(email: string, password: string, phone: string, name: string) {
        try {
            this.LoadingService.startLoading();

            const { data, error } = await this.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name,
                        phone: phone,
                    }
                }
            });

            if (error) {
                this.notificationService.error('Erro ao registrar', error.message || 'Tente novamente.');
                this.LoadingService.stopLoading();
                return;
            }

            if (data?.user && !data.session && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
                this.notificationService.error('Erro ao registrar', 'E-mail já cadastrado. Verifique sua caixa de entrada.');
                this.LoadingService.stopLoading();
                return;
            }

            // Cadastro normal — sucesso
            this.notificationService.success('E-mail enviado!', 'Verifique seu e-mail para confirmar o cadastro.');
            this.LoadingService.stopLoading();

        } catch (err) {
            //console.error('Erro ao registrar:', err);
            this.notificationService.error('Erro ao registrar', 'Tente novamente.');
            this.LoadingService.stopLoading();
        }

    }


    // auth.service.ts
    async logoutService() {
        await this.supabase.auth.signOut();
        this.currentUser.set(null);
        this.isLoggedInGuard.set(false);
    }

    // Método para limpar a sessão e redirecionar para login
    async purgeAndRedirect(): Promise<void> {
        await this.supabase.auth.signOut();
        this.currentUser.set(null); // Limpa o estado do usuário
        this.isLoggedInGuard.set(false); // Marca que não há sessão ativa
    }

    async loginWithGoogle(): Promise<void> {
        console.log('Clique no botão de login com Google');

        try {
            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: 'google',
            });

            if (error) {
                this.notificationService.error('Erro ao continuar', 'Tente novamente.');
                console.error('Erro ao logar com Google:', error.message);
                return;
            }

            // O Supabase automaticamente lida com cadastro e login via OAuth
            // Aqui normalmente o fluxo redireciona para a rota definida
            //console.log('Redirecionando para confirmar login...');
        } catch (err) {
            console.error('Erro inesperado ao logar com Google:', err);
            this.notificationService.error('Erro inesperado', 'Tente novamente.');
        }
    }

}