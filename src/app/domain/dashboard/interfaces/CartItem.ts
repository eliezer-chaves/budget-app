export interface CartItem {
    id: number;
    itm_auth_id: string | undefined;
    itm_name: string;
    itm_value: number;
    itm_quantity: number;
    itm_total: number;
    itm_cart_id: string;
    cartName: string;
}
