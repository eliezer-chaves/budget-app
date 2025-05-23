
import { CartItem } from '@domain/dashboard/interfaces/CartItem';

export interface PurchaseData {
    purchaseId: number;
    
    cartsIds: number[];
    nomeCarrinhos: string[];
    mercado: string;
    compraFinalizada: boolean;
    items: CartItem[];
    dataCompra?: Date;
    qtdCarrinhos?: number;
}
