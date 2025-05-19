import { inject } from '@angular/core';

import { SupabaseService } from '../services/supabase/supabase.service';


export const injectSupabase = () => {
    const serviceDoSupabase = inject(SupabaseService);
    return serviceDoSupabase.supabase;
}