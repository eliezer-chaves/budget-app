import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  supabase: SupabaseClient;
  constructor() { 
    this.supabase = createClient(environment.SUPABASE_URL, environment.SUPABASE_KEY);
  }

}